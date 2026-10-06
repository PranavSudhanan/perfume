"use client";

import { useState, useTransition } from "react";
import { sendMessageAction, subscribeAction } from "@/lib/actions/shop";

/** Hidden from people; bots that fill every input reveal themselves. */
function Honeypot() {
  return (
    <input
      type="text"
      name="website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="absolute -left-[9999px] h-0 w-0 opacity-0"
    />
  );
}

export function NewsletterForm({ buttonLabel = "Subscribe" }: { buttonLabel?: string }) {
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  if (status?.ok) return <p className="text-sm">{status.text}</p>;

  return (
    <form
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        start(async () => {
          const res = await subscribeAction({ email: form.get("email"), website: form.get("website") });
          setStatus(
            res.ok ? { ok: true, text: "Thank you — you’re on the list." } : { ok: false, text: res.error },
          );
        });
      }}
    >
      <Honeypot />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          placeholder="Your email address"
          aria-label="Email address"
          className="field flex-1"
        />
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Joining…" : buttonLabel || "Subscribe"}
        </button>
      </div>
      {status && !status.ok && <p className="mt-2 text-sm text-red-500">{status.text}</p>}
    </form>
  );
}

export function ContactForm() {
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  if (status?.ok) {
    return (
      <div className="border-line rounded-theme border p-8 text-center">
        <p className="heading text-2xl">Message sent</p>
        <p className="text-muted mt-2">{status.text}</p>
      </div>
    );
  }

  return (
    <form
      className="relative space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = Object.fromEntries(new FormData(e.currentTarget));
        start(async () => {
          const res = await sendMessageAction(form);
          setStatus(
            res.ok
              ? { ok: true, text: "Thank you for writing. We’ll get back to you shortly." }
              : { ok: false, text: res.error },
          );
        });
      }}
    >
      <Honeypot />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Name</span>
          <input name="name" required maxLength={100} className="field" autoComplete="name" />
        </label>
        <label className="block">
          <span className="field-label">Email</span>
          <input name="email" type="email" required className="field" autoComplete="email" />
        </label>
      </div>
      <label className="block">
        <span className="field-label">Subject</span>
        <input name="subject" maxLength={150} className="field" />
      </label>
      <label className="block">
        <span className="field-label">Message</span>
        <textarea name="body" required rows={6} maxLength={4000} className="field resize-y" />
      </label>
      {status && !status.ok && <p className="text-sm text-red-500">{status.text}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
