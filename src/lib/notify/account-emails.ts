import "server-only";
import type { Delivery } from "@/db/schema";
import { getSettings } from "@/lib/data";
import { deliverEmail, replyAddress } from "./deliver";
import { emailConfigured, sendEmail } from "./email";
import { passwordResetEmail } from "./templates";

/** How long a password-reset link stays valid. */
export const RESET_LINK_MINUTES = 60;

/** Emails a password-reset link. Never throws. */
export async function sendPasswordResetEmail(
  user: { name: string; email: string },
  link: string,
): Promise<Delivery> {
  const settings = await getSettings();
  const result = await deliverEmail({
    to: user.email,
    content: passwordResetEmail(settings, user.name, link, RESET_LINK_MINUTES),
    fromName: settings.store.name,
    replyTo: replyAddress(settings.store.email),
    // One file per address; a newer request simply replaces the older preview.
    previewFile: `password-reset-${user.email.replace(/[^a-z0-9]+/gi, "-")}.html`,
  });
  // The link itself is a credential, so only the outcome is logged.
  if (result.status === "failed") console.error(`Password reset email failed: ${result.detail}`);
  return result;
}

/** Sends a short test message so an admin can check the email connection. Throws on failure. */
export async function sendTestEmail(to: string) {
  if (!emailConfigured()) {
    throw new Error("Email is not connected yet. Add the SMTP settings to your environment variables.");
  }
  const { store } = await getSettings();
  await sendEmail({
    to,
    fromName: store.name,
    subject: `Test email from ${store.name}`,
    text: `This is a test from your ${store.name} store. If you are reading it, order confirmations, shipping updates and password reset emails will reach your customers.`,
    html: `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:24px;">This is a test from your <strong>${store.name.replace(/[<>&"]/g, "")}</strong> store.<br>If you are reading it, order confirmations, shipping updates and password reset emails will reach your customers.</p>`,
  });
}
