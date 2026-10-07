import "server-only";
import { eq } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/db";
import { users, type Address } from "@/db/schema";

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 30;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET is not set. Add it to your environment variables.");
    }
    return new TextEncoder().encode("dev-only-secret-set-AUTH_SECRET-before-deploying");
  }
  return new TextEncoder().encode(value);
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  phone: string | null;
  address: Address | null;
};

export async function createSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/**
 * The signed cookie only identifies the user; role and profile are read from the
 * database on every request so a demoted or deleted account loses access at once.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  let userId: string | undefined;
  let issuedAt = 0;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    userId = payload.sub;
    issuedAt = payload.iat ?? 0;
  } catch {
    return null;
  }
  if (!userId) return null;
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      address: users.address,
      passwordChangedAt: users.passwordChangedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return null;
  const { passwordChangedAt, ...user } = row;
  // Changing or resetting a password signs out every device that was signed in before it.
  if (passwordChangedAt && issuedAt < Math.floor(passwordChangedAt.getTime() / 1000)) return null;
  return user;
});

/**
 * The value to store in `users.passwordChangedAt`: now, rounded down to the
 * second, because that is the precision of a session's issue time. A session
 * created right after the change must still count as newer.
 */
export function passwordChangedNow() {
  return new Date(Math.floor(Date.now() / 1000) * 1000);
}

export class UnauthorizedError extends Error {
  constructor() {
    super("You are not authorised to do this.");
  }
}

/** Every admin page, action and route handler must call this before touching data. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new UnauthorizedError();
  return user;
}
