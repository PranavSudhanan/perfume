import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/store/account-forms";
import { getSettings } from "@/lib/data";
import { RESET_LINK_MINUTES } from "@/lib/notify/account-emails";
import { emailAvailable } from "@/lib/notify/deliver";

export const metadata: Metadata = { title: "Forgot your password?", robots: { index: false } };

export default async function ForgotPasswordPage() {
  const { store } = await getSettings();

  return (
    <div className="container-page py-16 md:py-24">
      <div className="mx-auto max-w-md">
        <h1 className="heading text-center text-5xl">Forgot your password?</h1>
        {emailAvailable() ? (
          <>
            <p className="text-muted mt-4 mb-8 text-center">
              Enter the email you signed up with and we’ll send you a link to choose a new one.
            </p>
            <ForgotPasswordForm validMinutes={RESET_LINK_MINUTES} />
          </>
        ) : (
          // Without a mail service connected there is no way to send the link, so say so plainly.
          <div className="border-line rounded-theme mt-8 border p-8 text-center">
            <p className="text-muted leading-relaxed">
              Password reset by email isn’t available right now.
              {store.email ? " Please write to us and we’ll help you get back in:" : " Please contact us for help."}
            </p>
            {store.email && (
              <a href={`mailto:${store.email}`} className="link-underline mt-2 inline-block">
                {store.email}
              </a>
            )}
            <div className="mt-6">
              <Link href="/account/login" className="btn btn-outline">
                Back to sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
