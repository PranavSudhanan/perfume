"use client";

import { Banknote, CreditCard, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Address } from "@/db/schema";
import { placeOrderAction } from "@/lib/actions/shop";
import { cart, cartSubtotal, toLines, useCart } from "@/lib/cart";
import type { Country } from "@/lib/geo";
import { CartThumb } from "./cart-drawer";
import { clearCoupon, CouponField, readCoupon, Totals } from "./cart-view";
import { RegionFields } from "./region-fields";
import { useMoney } from "./store-context";
import { useQuote } from "./use-quote";

type Method = "cod" | "razorpay";

type Props = {
  defaults: { name: string; email: string; phone: string; address: Address | null };
  methods: Method[];
  /** Countries the store delivers to; the first is preselected. */
  countries: Country[];
  note: string;
  signedIn: boolean;
};

const METHOD_INFO: Record<Method, { label: string; text: string; icon: typeof Banknote }> = {
  razorpay: {
    label: "Pay online",
    text: "UPI, cards, net banking and wallets — secured by Razorpay.",
    icon: CreditCard,
  },
  cod: { label: "Cash on delivery", text: "Pay in cash when your order arrives.", icon: Banknote },
};

export function CheckoutForm({ defaults, methods, countries, note, signedIn }: Props) {
  const router = useRouter();
  const money = useMoney();
  const { items, ready } = useCart();
  const [coupon, setCoupon] = useState(readCoupon);
  const { quote, loading } = useQuote(items, coupon);
  const [method, setMethod] = useState<Method | undefined>(methods[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // Keeps the form visible while navigating to the confirmation after the bag is cleared.
  const [placed, setPlaced] = useState(false);

  if (!ready) return <div className="min-h-[50vh]" aria-busy="true" />;
  if (!items.length && !placed) {
    return (
      <div className="py-20 text-center">
        <p className="heading text-3xl">Your bag is empty</p>
        <Link href="/shop" className="btn btn-primary mt-8">
          Shop perfumes
        </Link>
      </div>
    );
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!method) return;
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "");
    setError(null);
    start(async () => {
      const result = await placeOrderAction({
        lines: toLines(items),
        couponCode: quote?.couponCode ?? null,
        name: text("name"),
        email: text("email"),
        phone: text("phone"),
        address: {
          line1: text("line1"),
          line2: text("line2"),
          city: text("city"),
          state: text("state"),
          postalCode: text("postalCode"),
          country: text("country"),
        },
        paymentMethod: method,
        note: text("note"),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPlaced(true);
      cart.clear();
      clearCoupon();
      router.push(`/order/${result.orderId}?placed=1${method === "razorpay" ? "&pay=1" : ""}`);
    });
  }

  const a = defaults.address;
  const blocked = pending || placed || !method || (quote !== null && !quote.valid);

  return (
    <form onSubmit={submit} className="grid gap-12 lg:grid-cols-[1fr_420px] lg:gap-16">
      <div className="space-y-10">
        <section>
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="heading text-3xl">Contact</h2>
            {!signedIn && (
              <p className="text-muted text-sm">
                Have an account?{" "}
                <Link href="/account/login?next=/checkout" className="text-ink link-underline">
                  Sign in
                </Link>
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="field-label">Email</span>
              <input name="email" type="email" required defaultValue={defaults.email} autoComplete="email" className="field" />
            </label>
            <label className="block">
              <span className="field-label">Full name</span>
              <input name="name" required defaultValue={defaults.name} autoComplete="name" className="field" />
            </label>
            <label className="block">
              <span className="field-label">Phone</span>
              <input name="phone" type="tel" required defaultValue={defaults.phone} autoComplete="tel" className="field" />
            </label>
          </div>
        </section>

        <section>
          <h2 className="heading mb-5 text-3xl">Delivery address</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="field-label">Address</span>
              <input name="line1" required defaultValue={a?.line1} autoComplete="address-line1" className="field" />
            </label>
            <label className="block sm:col-span-2">
              <span className="field-label">Apartment, landmark (optional)</span>
              <input name="line2" defaultValue={a?.line2} autoComplete="address-line2" className="field" />
            </label>
            <RegionFields countries={countries} defaults={a} required />
            <label className="block">
              <span className="field-label">Postal code</span>
              <input name="postalCode" required defaultValue={a?.postalCode} autoComplete="postal-code" className="field" />
            </label>
            <label className="block sm:col-span-2">
              <span className="field-label">Order note (optional)</span>
              <textarea name="note" rows={2} maxLength={500} className="field resize-y" />
            </label>
          </div>
        </section>

        <section>
          <h2 className="heading mb-5 text-3xl">Payment</h2>
          {methods.length === 0 ? (
            <p className="rounded-theme border border-red-300 p-4 text-sm text-red-600">
              No payment method is available right now. Please contact us to place your order.
            </p>
          ) : (
            <div className="space-y-3">
              {methods.map((m) => {
                const info = METHOD_INFO[m];
                const Icon = info.icon;
                return (
                  <label
                    key={m}
                    className={`rounded-theme flex cursor-pointer items-start gap-4 border p-4 transition ${method === m ? "border-ink bg-surface" : "border-line"}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m}
                      checked={method === m}
                      onChange={() => setMethod(m)}
                      className="accent-ink mt-1"
                    />
                    <span className="flex-1">
                      <span className="block font-medium">{info.label}</span>
                      <span className="text-muted block text-sm">{info.text}</span>
                    </span>
                    <Icon className="text-muted size-5" strokeWidth={1.5} />
                  </label>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <aside className="tone-surface bg-bg rounded-theme h-fit space-y-6 p-6 md:p-8 lg:sticky lg:top-28">
        <h2 className="heading text-3xl">Your order</h2>
        <ul className="space-y-4">
          {items.map((item, index) => {
            const problem = quote?.lines[index]?.error;
            return (
              <li key={item.key} className="flex gap-4">
                <div className="relative">
                  <CartThumb item={item} className="h-20 w-16" />
                  <span className="bg-ink text-bg absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full text-[10px]">
                    {item.qty}
                  </span>
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium">{item.name}</p>
                  {item.variantLabel && <p className="text-muted">{item.variantLabel}</p>}
                  {problem && <p className="text-red-500">{problem}</p>}
                </div>
                <p className="text-sm tabular-nums">{money(item.unitPrice * item.qty)}</p>
              </li>
            );
          })}
        </ul>
        <CouponField applied={quote?.couponCode ?? null} error={quote?.couponError ?? null} onApply={setCoupon} />
        <Totals quote={quote} loading={loading} fallbackSubtotal={cartSubtotal(items)} />
        {error && (
          <p role="alert" className="rounded-theme border border-red-300 p-3 text-sm text-red-600">
            {error}
          </p>
        )}
        <button type="submit" disabled={blocked} className="btn btn-primary w-full">
          <Lock className="size-3.5" />
          {pending || placed ? "Placing order…" : method === "razorpay" ? "Continue to payment" : "Place order"}
        </button>
        {quote && !quote.valid && (
          <p className="text-center text-sm text-red-500">
            Some items need attention.{" "}
            <Link href="/cart" className="link-underline">
              Review your bag
            </Link>
          </p>
        )}
        {note && <p className="text-muted text-center text-xs leading-relaxed">{note}</p>}
      </aside>
    </form>
  );
}
