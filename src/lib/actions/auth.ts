"use server";

import bcrypt from "bcryptjs";
import { and, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { authAttempts, users } from "@/db/schema";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth";
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
    .set({ passwordHash: await bcrypt.hash(parsed.data.next, 10) })
    .where(eq(users.id, user.id));
  return { ok: true };
}
