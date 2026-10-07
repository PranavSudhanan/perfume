import { CircleAlert, CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EntityForm } from "@/components/admin/crud";
import { TestEmailButton } from "@/components/admin/test-email-button";
import { Card, PageHeader } from "@/components/admin/ui";
import { saveSettingsAction } from "@/lib/actions/admin";
import { adminPage } from "@/lib/admin";
import { checkoutGroups, storeGroups } from "@/lib/admin-fields";
import { getSettings } from "@/lib/data";
import { COUNTRIES } from "@/lib/geo";
import { notificationSetup } from "@/lib/notify/deliver";
import { razorpayConfigured } from "@/lib/razorpay";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };

const TABS = [
  { key: "store", label: "Store details" },
  { key: "checkout", label: "Checkout & notifications" },
] as const;

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  const Icon = ok ? CircleCheck : CircleAlert;
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <Icon className={cn("mt-0.5 size-4 shrink-0", ok ? "text-emerald-600" : "text-amber-600")} />
      <span className="text-zinc-700">{children}</span>
    </li>
  );
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await adminPage();
  const [{ tab }, settings] = await Promise.all([searchParams, getSettings()]);
  const active = tab === "checkout" ? "checkout" : "store";
  const online = razorpayConfigured();
  const notify = notificationSetup();
  const smsName = { fast2sms: "Fast2SMS", twilio: "Twilio" };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Business details, currency, shipping, payments and order confirmations."
      />
      <div className="mb-5 flex w-fit gap-1 rounded-lg bg-zinc-100 p-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/settings?tab=${t.key}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition",
              active === t.key ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {active === "checkout" && (
        <Card title="Payment setup" className="mb-5">
          <ul className="space-y-2">
            <Check ok={settings.checkout.codEnabled}>
              Cash on delivery is {settings.checkout.codEnabled ? "on" : "off"}.
            </Check>
            <Check ok={online && settings.checkout.onlineEnabled}>
              {online
                ? settings.checkout.onlineEnabled
                  ? "Razorpay keys found — online payments are live at checkout."
                  : "Razorpay keys found, but online payments are switched off below."
                : "Online payments are not connected. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your Vercel environment variables, then redeploy."}
            </Check>
            {!settings.checkout.codEnabled && !(online && settings.checkout.onlineEnabled) && (
              <Check ok={false}>Customers currently have no way to pay. Enable at least one method.</Check>
            )}
          </ul>
        </Card>
      )}

      {active === "checkout" && (
        <Card
          title="Email and text message setup"
          description="Order confirmations, shipping updates and password-reset emails all go through the email connection below. The confirmation popup needs no setup."
          className="mb-5"
        >
          <ul className="space-y-2">
            {notify.preview && (
              <Check ok={false}>
                Preview mode is on (NOTIFICATIONS_PREVIEW): messages are saved to the .data/outbox
                folder on this computer and nothing is really sent.
              </Check>
            )}
            <Check ok={notify.email}>
              {notify.email
                ? "Email is connected — customers receive order confirmations, shipping updates and password-reset links."
                : "Email is not connected, so no emails are sent and “Forgot password” is unavailable. Add SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS to your environment variables, then redeploy."}
            </Check>
            <Check ok={!!notify.sms}>
              {notify.sms
                ? `Text messages are connected through ${smsName[notify.sms]}.`
                : "Text messages are not connected. Add FAST2SMS_API_KEY (India) or the three TWILIO_ variables to your environment variables, then redeploy."}
            </Check>
          </ul>
          {notify.email && (
            <div className="mt-4 border-t border-zinc-100 pt-4">
              <TestEmailButton />
            </div>
          )}
        </Card>
      )}

      {/* Keyed so switching tabs mounts a fresh form for that settings group. */}
      <EntityForm
        key={active}
        groups={active === "store" ? storeGroups : checkoutGroups}
        initial={active === "store" ? settings.store : settings.checkout}
        sources={{ countries: COUNTRIES.map((c) => ({ value: c.name, label: c.name })) }}
        action={saveSettingsAction.bind(null, active)}
      />
    </>
  );
}
