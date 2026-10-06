import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/store/account-forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (user) redirect("/account");
  return (
    <div className="container-page py-16 md:py-24">
      <div className="mx-auto max-w-md">
        <h1 className="heading text-center text-5xl">Create your account</h1>
        <p className="text-muted mt-4 mb-8 text-center">Save your details and keep track of every order.</p>
        <AuthForm mode="register" next={next} />
      </div>
    </div>
  );
}
