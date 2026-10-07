"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { authAttempts, passwordResets, users } from "@/db/schema";
import { createSession, destroySession, getCurrentUser, passwordChangedNow } from "@/lib/auth";
import { RESET_LINK_MINUTES, sendPasswordResetEmail } from "@/lib/notify/account-emails";
import { emailAvailable, publicBaseUrl } from "@/lib/notify/deliver";
import { hashToken } from "@/lib/password-reset";
import { fail, type ActionResult } from "@/lib/result";

const MAX_FAILED_ATTEMPTS = 8;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

const email = z.email("Enter a valid email address.").trim().toLowerCase().max(200);
const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(100, "Password is too long.");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100),
  email,
  password,
});

const addressSchema = z.object({
  line1: z.string().trim().max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100),
  state: z.string().trim().max(100),
  postalCode: z.string().trim().max(12),
  country: z.string().trim().max(60),
});

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

export async function registerAction(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { name, email, password } = parsed.data;

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) return fail("An account with this email already exists. Try signing in.");

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash: await bcrypt.hash(password, 10) })
    .returning({ id: users.id });
  await createSession(user.id);
  return { ok: true };
}

export async function loginAction(
  input: unknown,
): Promise<ActionResult<{ role: "customer" | "admin" }>> {
  const parsed = z.object({ email, password: z.string().min(1).max(100) }).safeParse(input);
  if (!parsed.success) return fail("Enter your email and password.");
  const { email: identifier, password: attempt } = parsed.data;

  const since = new Date(Date.now() - ATTEMPT_WINDOW_MS);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(authAttempts)
    .where(and(eq(authAttempts.identifier, identifier), gt(authAttempts.createdAt, since)));
  if (count >= MAX_FAILED_ATTEMPTS) {
    return fail("Too many failed attempts. Please wait 15 minutes and try again.");
  }

  const [user] = await db.select().from(users).where(eq(users.email, identifier)).limit(1);
  // Compare against a dummy hash when the account doesn't exist so timing doesn't reveal it.
  const hash = user?.passwordHash ?? "$2b$10$CwTycUXWue0Thq9StjUM0uJ8bqk1Tz1H3cPqQ1o5i0v0l9i9zQx6e";
  const matches = await bcrypt.compare(attempt, hash);
  if (!user || !matches) {
    await db.insert(authAttempts).values({ identifier });
    return fail("Incorrect email or password.");
  }

  await db.delete(authAttempts).where(eq(authAttempts.identifier, identifier));
  await createSession(user.id);
  return { ok: true, role: user.role };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in again.");
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Enter your name.").max(100),
      phone: z.string().trim().max(20).optional(),
      address: addressSchema.optional(),
    })
    .safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { name, phone, address } = parsed.data;
  await db
    .update(users)
    .set({ name, phone: phone || null, address: address?.line1 ? address : null })
    .where(eq(users.id, user.id));
  return { ok: true };
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in again.");
  const parsed = z.object({ current: z.string().min(1).max(100), next: password }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id));
  if (!row || !(await bcrypt.compare(parsed.data.current, row.passwordHash))) {
    return fail("Your current password is incorrect.");
  }
  await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(parsed.data.next, 10), passwordChangedAt: passwordChangedNow() })
    .where(eq(users.id, user.id));
  // Every other device is signed out by the change; this one gets a fresh session.
  await createSession(user.id);
  return { ok: true };
}

/* -------------------------------- password reset -------------------------------- */

const MAX_RESET_REQUESTS = 3;
const RESET_REQUEST_WINDOW_MS = 15 * 60 * 1000;

/**
 * Step 1: someone enters their email on the "forgot password" page. The answer
 * is the same whether or not an account exists, and the email is sent after the
 * response, so neither the reply nor its timing reveals who has an account.
 */
export async function requestPasswordResetAction(input: unknown): Promise<ActionResult> {
  const parsed = z.object({ email, website: z.string().max(200).optional() }).safeParse(input);
  if (!parsed.success) return fail("Enter a valid email address.");
  if (parsed.data.website) return { ok: true };
  if (!emailAvailable()) {
    return fail("Password reset by email isn't available right now. Please contact us for help.");
  }

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (!user) return { ok: true };

  const [{ recent }] = await db
    .select({ recent: sql<number>`count(*)::int` })
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.userId, user.id),
        gt(passwordResets.createdAt, new Date(Date.now() - RESET_REQUEST_WINDOW_MS)),
      ),
    );
  if (recent >= MAX_RESET_REQUESTS) return { ok: true };

  const token = randomBytes(32).toString("base64url");
  await db.delete(passwordResets).where(lt(passwordResets.expiresAt, new Date()));
  await db.insert(passwordResets).values({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + RESET_LINK_MINUTES * 60 * 1000),
  });
  const link = `${await publicBaseUrl()}/account/reset-password?token=${token}`;
  after(() => sendPasswordResetEmail(user, link));
  return { ok: true };
}

/** Step 2: the link from the email is opened and a new password is chosen. */
export async function resetPasswordAction(
  input: unknown,
): Promise<ActionResult<{ role: "customer" | "admin" }>> {
  // Check the new password first, so a rejected password doesn't use up the link.
  const parsed = z.object({ token: z.string().min(20).max(200), password }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  // Deleting the row is what makes the link single-use, even if two requests race.
  const [used] = await db
    .delete(passwordResets)
    .where(
      and(
        eq(passwordResets.tokenHash, hashToken(parsed.data.token)),
        gt(passwordResets.expiresAt, new Date()),
      ),
    )
    .returning({ userId: passwordResets.userId });
  if (!used) return fail("This link has expired or was already used. Please request a new one.");

  const [user] = await db
    .update(users)
    .set({
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      passwordChangedAt: passwordChangedNow(),
    })
    .where(eq(users.id, used.userId))
    .returning({ id: users.id, email: users.email, role: users.role });
  if (!user) return fail("This account no longer exists.");

  // Any other outstanding links, and any sign-in lockout, end with the reset.
  await db.delete(passwordResets).where(eq(passwordResets.userId, user.id));
  await db.delete(authAttempts).where(eq(authAttempts.identifier, user.email));
  await createSession(user.id);
  return { ok: true, role: user.role };
}
