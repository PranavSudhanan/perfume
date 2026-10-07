import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/store/account-forms";
import { resetTokenValid } from "@/lib/password-reset";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false },
  // The address of this page contains the reset link's secret; never pass it on to other sites.
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const valid = await resetTokenValid(token);

  return (
    <div className="container-page py-16 md:py-24">
      <div className="mx-auto max-w-md">
        {valid && token ? (
          <>
            <h1 className="heading text-center text-5xl">Choose a new password</h1>
            <p className="text-muted mt-4 mb-8 text-center">
              You’ll be signed in as soon as it’s saved, and signed out everywhere else.
            </p>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <div className="text-center">
            <h1 className="heading text-5xl">This link has expired</h1>
            <p className="text-muted mt-4 leading-relaxed">
              Password reset links work once and only for a short time. Request a new one and use it
              straight away.
            </p>
            <Link href="/account/forgot-password" className="btn btn-primary mt-8">
              Send me a new link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
