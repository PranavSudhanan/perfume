import "server-only";
import nodemailer from "nodemailer";

/**
 * Email goes out over SMTP, so any provider works: Gmail or Google Workspace,
 * Zoho, Brevo, Resend, Amazon SES… Set SMTP_HOST, SMTP_PORT, SMTP_USER,
 * SMTP_PASS and (optionally) EMAIL_FROM.
 */
export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Shown as the sender's name unless EMAIL_FROM already includes one. */
  fromName: string;
  replyTo?: string;
};

export function emailConfigured() {
  return Boolean(process.env.SMTP_HOST && (process.env.EMAIL_FROM || process.env.SMTP_USER));
}

function transport() {
  const host = process.env.SMTP_HOST ?? "";
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = port === 465;
  const local = host === "localhost" || host === "127.0.0.1";
  return nodemailer.createTransport({
    host,
    port,
    secure,
    // Never hand the password or a customer's details to a remote server unencrypted.
    requireTLS: !secure && !local,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" }
      : undefined,
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 10_000,
  });
}

/** Sends one email. Throws if the server refuses it or can't be reached. */
export async function sendEmail(message: EmailMessage) {
  const sender = (process.env.EMAIL_FROM || process.env.SMTP_USER || "").trim();
  await transport().sendMail({
    // EMAIL_FROM may be a bare address or already in "Name <address>" form.
    from: sender.includes("<") ? sender : { name: message.fromName, address: sender },
    to: message.to,
    replyTo: message.replyTo || undefined,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
