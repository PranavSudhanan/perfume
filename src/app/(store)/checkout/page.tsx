import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/checkout-form";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { toCountries } from "@/lib/geo";
import { razorpayConfigured } from "@/lib/razorpay";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [{ checkout }, user] = await Promise.all([getSettings(), getCurrentUser()]);
  const methods: ("cod" | "razorpay")[] = [];
  if (checkout.onlineEnabled && razorpayConfigured()) methods.push("razorpay");
  if (checkout.codEnabled) methods.push("cod");

  return (
    <div className="container-page py-12 md:py-16">
      <h1 className="heading mb-10 text-center text-5xl md:text-6xl">Checkout</h1>
      <CheckoutForm
        defaults={{
          name: user?.name ?? "",
          email: user?.email ?? "",
          phone: user?.phone ?? "",
          address: user?.address ?? null,
        }}
        methods={methods}
        countries={toCountries(checkout.shipCountries)}
        note={checkout.checkoutNote}
        signedIn={!!user}
      />
    </div>
  );
}
