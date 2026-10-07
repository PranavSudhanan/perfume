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
  requestPasswordResetAction,
  resetPasswordAction,
  updateProfileAction,
} from "@/lib/actions/auth";
import { trackOrderAction } from "@/lib/actions/shop";
import type { Country } from "@/lib/geo";
import { RegionFields } from "./region-fields";

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
      {!register && (
        <p className="-mt-1 text-right text-sm">
          <Link href="/account/forgot-password" className="text-muted link-underline">
            Forgot your password?
          </Link>
        </p>
      )}
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
  countries,
}: {
  user: { name: string; phone: string | null; address: Address | null };
  /** Countries the store delivers to. */
  countries: Country[];
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
        <RegionFields countries={countries} defaults={a} />
        <label className="block">
          <span className="field-label">Postal code</span>
          <input name="postalCode" defaultValue={a?.postalCode} className="field" />
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

/** Step 1 of a password reset: ask for the account's email address. */
export function ForgotPasswordForm({ validMinutes }: { validMinutes: number }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (sentTo) {
    return (
      <div className="border-line rounded-theme border p-8 text-center">
        <p className="heading text-3xl">Check your inbox</p>
        {/* Deliberately the same message whether or not an account exists for the address. */}
        <p className="text-muted mt-3 text-sm leading-relaxed">
          If there is an account for <span className="text-ink [overflow-wrap:anywhere]">{sentTo}</span>,
          we’ve emailed a link to choose a new password. It works once and expires in {validMinutes}{" "}
          minutes.
        </p>
        <p className="text-muted mt-3 text-sm">Nothing arrived? Check your spam folder, or try again.</p>
        <Link href="/account/login" className="btn btn-outline mt-6">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      className="relative space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = Object.fromEntries(new FormData(e.currentTarget));
        setError(null);
        start(async () => {
          const result = await requestPasswordResetAction(form);
          if (result.ok) setSentTo(String(form.email).trim());
          else setError(result.error);
        });
      }}
    >
      {/* Hidden from people; bots that fill every input reveal themselves. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <label className="block">
        <span className="field-label">Email</span>
        <input name="email" type="email" required autoComplete="email" className="field" />
      </label>
      <FormError text={error} />
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Please wait…" : "Email me a reset link"}
      </button>
      <p className="text-muted text-center text-sm">
        Remembered it?{" "}
        <Link href="/account/login" className="text-ink link-underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

/** Step 2 of a password reset: choose the new password, using the link from the email. */
export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const password = String(form.get("password") ?? "");
        if (password !== String(form.get("confirm") ?? "")) {
          setError("The two passwords don’t match.");
          return;
        }
        setError(null);
        start(async () => {
          const result = await resetPasswordAction({ token, password });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          // The reset signs the person in; send them where they belong.
          router.push(result.role === "admin" ? "/admin" : "/account");
          router.refresh();
        });
      }}
    >
      <label className="block">
        <span className="field-label">New password</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className="field" />
        <span className="text-muted mt-1.5 block text-xs">At least 8 characters.</span>
      </label>
      <label className="block">
        <span className="field-label">Repeat new password</span>
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="field" />
      </label>
      <FormError text={error} />
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
