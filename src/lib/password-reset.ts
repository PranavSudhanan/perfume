import "server-only";
import { createHash } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { passwordResets } from "@/db/schema";

/** Only this hash is stored, so a copy of the database can't be used to reset passwords. */
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Whether a reset link is still usable. The reset page uses this to say
 * "this link has expired" up front instead of after a new password is typed.
 * It does not use the link up.
 */
export async function resetTokenValid(token: string | undefined) {
  if (!token || token.length < 20 || token.length > 200) return false;
  const [row] = await db
    .select({ id: passwordResets.id })
    .from(passwordResets)
    .where(and(eq(passwordResets.tokenHash, hashToken(token)), gt(passwordResets.expiresAt, new Date())))
    .limit(1);
  return !!row;
}
