"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Address } from "@/db/schema";
import {
  changePasswordAction,
  loginAction,
  logoutAction,
  registerAction,
  updateProfileAction,
} from "@/lib/actions/auth";
import { trackOrderAction } from "@/lib/actions/shop";

/** Only same-site paths are honoured as a post-login destination. */
function safeNext(next: string | undefined, fallback: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

function FormError({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p role="alert" className="rounded-theme border border-red-300 p-3 text-sm text-red-600">
      {text}
    </p>
  );
}

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const register = mode === "register";
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = Object.fromEntries(new FormData(e.currentTarget));
        setError(null);
        start(async () => {
          const result = register ? await registerAction(form) : await loginAction(form);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push(safeNext(next, "/account"));
          router.refresh();
        });
      }}
    >
      {register && (
        <label className="block">
          <span className="field-label">Full name</span>
          <input name="name" required autoComplete="name" className="field" />
        </label>
      )}
      <label className="block">
        <span className="field-label">Email</span>
        <input name="email" type="email" required autoComplete="email" className="field" />
      </label>
      <label className="block">
        <span className="field-label">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={register ? 8 : undefined}
          autoComplete={register ? "new-password" : "current-password"}
          className="field"
        />
        {register && <span className="text-muted mt-1.5 block text-xs">At least 8 characters.</span>}
      </label>
      <FormError text={error} />
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Please wait…" : register ? "Create account" : "Sign in"}
      </button>
      <p className="text-muted text-center text-sm">
        {register ? "Already have an account? " : "New here? "}
        <Link
          href={`${register ? "/account/login" : "/account/register"}${nextQuery}`}
          className="text-ink link-underline"
        >
          {register ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={className ?? "btn btn-outline btn-sm"}
      onClick={() =>
        start(async () => {
          await logoutAction();
          router.push("/");
          router.refresh();
        })
      }
    >
      Sign out
    </button>
  );
}

export function ProfileForm({
  user,
  country,
}: {
  user: { name: string; phone: string | null; address: Address | null };
  country: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const a = user.address;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const text = (name: string) => String(form.get(name) ?? "");
        start(async () => {
          const result = await updateProfileAction({
            name: text("name"),
            phone: text("phone"),
            address: {
              line1: text("line1"),
              line2: text("line2"),
              city: text("city"),
              state: text("state"),
              postalCode: text("postalCode"),
              country: text("country"),
            },
          });
          setStatus(result.ok ? { ok: true, text: "Saved." } : { ok: false, text: result.error });
          if (result.ok) router.refresh();
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Full name</span>
          <input name="name" required defaultValue={user.name} className="field" />
        </label>
        <label className="block">
          <span className="field-label">Phone</span>
          <input name="phone" type="tel" defaultValue={user.phone ?? ""} className="field" />
        </label>
        <label className="block sm:col-span-2">
          <span className="field-label">Address</span>
          <input name="line1" defaultValue={a?.line1} className="field" />
        </label>
        <label className="block sm:col-span-2">
          <span className="field-label">Apartment, landmark</span>
          <input name="line2" defaultValue={a?.line2} className="field" />
        </label>
        <label className="block">
          <span className="field-label">City</span>
          <input name="city" defaultValue={a?.city} className="field" />
        </label>
        <label className="block">
          <span className="field-label">State</span>
          <input name="state" defaultValue={a?.state} className="field" />
        </label>
        <label className="block">
          <span className="field-label">Postal code</span>
          <input name="postalCode" defaultValue={a?.postalCode} className="field" />
        </label>
        <label className="block">
          <span className="field-label">Country</span>
          <input name="country" defaultValue={a?.country || country} className="field" />
        </label>
      </div>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Save details"}
        </button>
        {status && (
          <span className={`text-sm ${status.ok ? "text-muted" : "text-red-500"}`}>{status.text}</span>
        )}
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const target = e.currentTarget;
        const form = Object.fromEntries(new FormData(target));
        start(async () => {
          const result = await changePasswordAction(form);
          setStatus(
            result.ok ? { ok: true, text: "Password updated." } : { ok: false, text: result.error },
          );
          if (result.ok) target.reset();
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Current password</span>
          <input name="current" type="password" required autoComplete="current-password" className="field" />
        </label>
        <label className="block">
          <span className="field-label">New password</span>
          <input name="next" type="password" required minLength={8} autoComplete="new-password" className="field" />
        </label>
      </div>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-outline">
          {pending ? "Updating…" : "Change password"}
        </button>
        {status && (
          <span className={`text-sm ${status.ok ? "text-muted" : "text-red-500"}`}>{status.text}</span>
        )}
      </div>
    </form>
  );
}

export function TrackForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = Object.fromEntries(new FormData(e.currentTarget));
        setError(null);
        start(async () => {
          const result = await trackOrderAction(form);
          if (result.ok) router.push(`/order/${result.orderId}`);
          else setError(result.error);
        });
      }}
    >
      <label className="block">
        <span className="field-label">Order number</span>
        <input name="orderNumber" required placeholder="e.g. AU-7K3M9QX" className="field uppercase placeholder:normal-case" />
      </label>
      <label className="block">
        <span className="field-label">Email used at checkout</span>
        <input name="email" type="email" required autoComplete="email" className="field" />
      </label>
      <FormError text={error} />
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Looking…" : "Track order"}
      </button>
    </form>
  );
}
