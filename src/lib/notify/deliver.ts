import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { headers } from "next/headers";
import type { Delivery } from "@/db/schema";
import { siteUrl } from "@/lib/site";
import { emailConfigured, sendEmail } from "./email";
import { smsProvider } from "./sms";
import type { EmailContent } from "./templates";

export const OUTBOX = ".data/outbox";
/** Upper bound per message, so a slow provider can't hold up a checkout or an admin save. */
const TIMEOUT_MS = 12_000;

/**
 * Local development aid: with NOTIFICATIONS_PREVIEW=true nothing is sent;
 * messages are written to .data/outbox so you can open them. Ignored in production.
 */
export function previewMode() {
  return process.env.NODE_ENV !== "production" && process.env.NOTIFICATIONS_PREVIEW === "true";
}

/** What is connected right now — shown on the admin settings page. */
export function notificationSetup() {
  return { email: emailConfigured(), sms: smsProvider(), preview: previewMode() };
}

/** True when an email would actually reach someone (or be saved, in preview mode). */
export function emailAvailable() {
  return emailConfigured() || previewMode();
}

/**
 * The address links in messages should point at. In production this is always
 * the configured site address, never the request's Host header, so a forged
 * request can't make the store email out links to someone else's domain.
 * In development it follows whatever port the dev server is running on.
 */
export async function publicBaseUrl() {
  if (process.env.NODE_ENV !== "production") {
    try {
      const requestHeaders = await headers();
      const host = requestHeaders.get("host");
      if (host) return `${requestHeaders.get("x-forwarded-proto") ?? "http"}://${host}`;
    } catch {
      // Not inside a request (e.g. a script): fall through to the configured address.
    }
  }
  return siteUrl();
}

const now = () => new Date().toISOString();

export const skipped = (detail: string): Delivery => ({ status: "skipped", detail, at: now() });

/** Runs one send and reports the outcome instead of throwing. */
export async function attempt(send: () => Promise<void>): Promise<Delivery> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      send(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Timed out.")), TIMEOUT_MS);
      }),
    ]);
    return { status: "sent", at: now() };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error.";
    return { status: "failed", detail: detail.slice(0, 300), at: now() };
  } finally {
    clearTimeout(timer);
  }
}

/** Preview mode: save the message to the outbox folder instead of sending it. */
export async function saveToOutbox(file: string, content: string): Promise<Delivery> {
  const result = await attempt(async () => {
    await mkdir(OUTBOX, { recursive: true });
    await writeFile(`${OUTBOX}/${file}`, content, "utf8");
  });
  if (result.status !== "sent") return result;
  console.log(`[notifications preview] ${OUTBOX}/${file}`);
  return { ...result, detail: `Preview mode: saved to ${OUTBOX}/${file}; nothing was sent.` };
}

/**
 * Sends one email and reports what happened. Never throws: every caller treats
 * email as best-effort next to the thing that actually matters (the order, the
 * status change, the reset request).
 */
export async function deliverEmail(message: {
  to: string;
  content: EmailContent;
  /** Shown as the sender's name. */
  fromName: string;
  replyTo?: string;
  /** File name used when preview mode saves the email instead of sending it. */
  previewFile: string;
}): Promise<Delivery> {
  if (previewMode()) return saveToOutbox(message.previewFile, message.content.html);
  if (!emailConfigured()) return skipped("Email is not connected yet.");
  return attempt(() =>
    sendEmail({
      ...message.content,
      to: message.to,
      fromName: message.fromName,
      replyTo: message.replyTo,
    }),
  );
}

/** The store's contact address, if it looks usable as a Reply-To. */
export function replyAddress(storeEmail: string) {
  return /^\S+@\S+\.\S+$/.test(storeEmail) ? storeEmail : undefined;
}
