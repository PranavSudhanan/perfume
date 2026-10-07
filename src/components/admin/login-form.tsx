"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { loginAction } from "@/lib/actions/auth";
import { ui } from "./ui";

export function AdminLoginForm({ denied }: { denied: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(
    denied ? "That account doesn't have admin access. Sign in with an admin account." : null,
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = Object.fromEntries(new FormData(e.currentTarget));
        setError(null);
        start(async () => {
          const result = await loginAction(form);
          if (!result.ok) {
            setError(result.error);
          } else if (result.role !== "admin") {
            setError("That account doesn't have admin access.");
          } else {
            router.push("/admin");
            router.refresh();
          }
        });
      }}
    >
      <label className="block">
        <span className={ui.label}>Email</span>
        <input name="email" type="email" required autoComplete="username" className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Password</span>
        <input name="password" type="password" required autoComplete="current-password" className={ui.input} />
        <Link
          href="/account/forgot-password"
          className="mt-1.5 inline-block text-xs text-zinc-500 hover:text-zinc-900"
        >
          Forgot password?
        </Link>
      </label>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${ui.btn} w-full`}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
