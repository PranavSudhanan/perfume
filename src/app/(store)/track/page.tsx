import type { Metadata } from "next";
import { TrackForm } from "@/components/store/account-forms";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Track your order" };

export default async function TrackPage() {
  const { checkout } = await getSettings();
  return (
    <div className="container-page py-16 md:py-24">
      <div className="mx-auto max-w-md">
        <h1 className="heading text-center text-5xl">Track your order</h1>
        <p className="text-muted mt-4 mb-8 text-center">
          Enter the order number from your confirmation and the email you used at checkout.
        </p>
        {/* Same clean-up the order number itself gets, so the example looks like a real one. */}
        <TrackForm orderPrefix={checkout.orderPrefix.replace(/[^A-Za-z0-9]/g, "").toUpperCase()} />
      </div>
    </div>
  );
}
