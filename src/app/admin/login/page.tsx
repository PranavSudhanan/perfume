import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/login-form";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const [{ denied }, user, { store }] = await Promise.all([searchParams, getCurrentUser(), getSettings()]);
  if (user?.role === "admin") redirect("/admin");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4 font-sans text-zinc-900">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-semibold tracking-tight">{store.name} admin</h1>
        <p className="mt-1 mb-6 text-center text-sm text-zinc-500">Sign in to manage your store.</p>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <AdminLoginForm denied={denied === "1" || !!user} />
        </div>
      </div>
    </div>
  );
}
