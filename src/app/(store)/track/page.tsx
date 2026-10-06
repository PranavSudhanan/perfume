import type { Metadata } from "next";
import { TrackForm } from "@/components/store/account-forms";

export const metadata: Metadata = { title: "Track your order" };

export default function TrackPage() {
  return (
    <div className="container-page py-16 md:py-24">
      <div className="mx-auto max-w-md">
        <h1 className="heading text-center text-5xl">Track your order</h1>
        <p className="text-muted mt-4 mb-8 text-center">
          Enter the order number from your confirmation and the email you used at checkout.
        </p>
        <TrackForm />
      </div>
    </div>
  );
}
