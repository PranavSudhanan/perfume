"use client";

import { Send } from "lucide-react";
import { useState, useTransition } from "react";
import { sendTestEmailAction } from "@/lib/actions/admin";
import { ui } from "./ui";

/** Sends a test email to the signed-in admin and reports what happened. */
export function TestEmailButton() {
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pending}
        className={ui.btnSecondary}
        onClick={() =>
          start(async () => {
            const result = await sendTestEmailAction();
            setStatus(
              result.ok
                ? { ok: true, text: `Sent. Check the inbox of ${result.to}.` }
                : { ok: false, text: result.error },
            );
          })
        }
      >
        <Send className="size-4" /> {pending ? "Sending…" : "Send me a test email"}
      </button>
      {status && (
        <span role="status" className={`text-sm ${status.ok ? "text-emerald-700" : "text-red-600"}`}>
          {status.text}
        </span>
      )}
    </div>
  );
}
