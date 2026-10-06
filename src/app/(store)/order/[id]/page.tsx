import { Check } from "lucide-react";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Bottle } from "@/components/store/bottle";
import { PayNow } from "@/components/store/pay-now";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getSettings } from "@/lib/data";
import { razorpayConfigured } from "@/lib/razorpay";
import { formatDate, formatMoney, safeHref } from "@/lib/utils";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string; pay?: string }>;
};

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;
const STEP_LABEL: Record<string, string> = {
  pending: "Placed",
  confirmed: "Confirmed",
  processing: "Being prepared",
  shipped: "Shipped",
  delivered: "Delivered",
};
const PAYMENT_LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
};

export default async function OrderPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  // The order id is an unguessable UUID, which is what lets guests view their order.
  if (!z.uuid().safeParse(id).success) notFound();
  const [order, { store }] = await Promise.all([
    db.query.orders.findFirst({ where: eq(orders.id, id), with: { items: true } }),
    getSettings(),
  ]);
  if (!order) notFound();

  const money = (minor: number) => formatMoney(minor, store);
  const cancelled = order.status === "cancelled";
  const currentStep = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const address = order.shippingAddress;
  const needsPayment =
    order.paymentMethod === "razorpay" && order.paymentStatus !== "paid" && !cancelled;
  const tracking = safeHref(order.trackingUrl, "");

  return (
    <div className="container-page py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="text-center">
          <p className="eyebrow mb-3">Order {order.orderNumber}</p>
          <h1 className="heading text-5xl md:text-6xl">
            {query.placed && !needsPayment ? "Thank you" : cancelled ? "Order cancelled" : "Your order"}
          </h1>
          <p className="text-muted mt-4">
            {query.placed && !needsPayment
              ? `We’ve received your order, ${order.name.split(" ")[0]}. Save your order number to track it later.`
              : `Placed on ${formatDate(order.createdAt, store.locale)}`}
          </p>
        </header>

        {needsPayment && (
          <div className="border-line rounded-theme mt-10 border p-6 text-center">
            <p className="font-medium">Payment pending</p>
            <p className="text-muted mt-1 mb-5 text-sm">
              Complete your payment of {money(order.total)} to confirm this order.
            </p>
            {razorpayConfigured() ? (
              <PayNow orderId={order.id} autoStart={query.pay === "1"} />
            ) : (
              <p className="text-sm">Online payment is unavailable right now — please contact us.</p>
            )}
          </div>
        )}

        {!cancelled && (
          <ol className="mt-12 grid grid-cols-5 text-center" aria-label="Order progress">
            {STEPS.map((step, i) => {
              const done = i <= currentStep;
              return (
                <li key={step} className="relative px-1" aria-current={i === currentStep ? "step" : undefined}>
                  {i > 0 && (
                    <span
                      className={`absolute top-4 right-1/2 -z-10 h-px w-full ${done ? "bg-ink" : "bg-line"}`}
                    />
                  )}
                  <span
                    className={`mx-auto flex size-8 items-center justify-center rounded-full border text-xs ${done ? "border-ink bg-ink text-bg" : "border-line bg-bg text-muted"}`}
                  >
                    {done ? <Check className="size-4" /> : i + 1}
                  </span>
                  <span className={`mt-2 block text-[0.68rem] tracking-wider uppercase ${done ? "" : "text-muted"}`}>
                    {STEP_LABEL[step]}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        {(order.trackingNumber || tracking) && (
          <p className="tone-surface bg-bg rounded-theme mt-8 p-4 text-center text-sm">
            Tracking number: <span className="font-medium">{order.trackingNumber ?? "—"}</span>
            {tracking && (
              <>
                {" · "}
                <a href={tracking} target="_blank" rel="noopener noreferrer" className="link-underline">
                  Track shipment
                </a>
              </>
            )}
          </p>
        )}

        <section className="border-line mt-12 border-t pt-8">
          <h2 className="heading mb-6 text-3xl">Items</h2>
          <ul className="divide-line divide-y">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-5 py-5">
                <div className="bg-surface rounded-theme h-28 w-24 shrink-0 overflow-hidden">
                  {item.custom ? (
                    <Bottle color={item.custom.liquidColor} label={item.custom.labelText} className="h-full w-full p-1.5" />
                  ) : item.image ? (
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-4">
                    <p className="font-medium">{item.name}</p>
                    <p className="shrink-0 tabular-nums">{money(item.unitPrice * item.quantity)}</p>
                  </div>
                  <p className="text-muted text-sm">
                    {[item.variantLabel, `Qty ${item.quantity}`].filter(Boolean).join(" · ")}
                  </p>
                  {item.custom && (
                    <dl className="text-muted mt-2 space-y-0.5 text-sm">
                      {item.custom.selections.map((s) => (
                        <div key={s.step} className="flex gap-2">
                          <dt className="shrink-0">{s.title}:</dt>
                          <dd className="text-ink">{s.options.join(", ")}</dd>
                        </div>
                      ))}
                      {item.custom.giftMessage && (
                        <div className="flex gap-2">
                          <dt className="shrink-0">Gift note:</dt>
                          <dd className="text-ink italic">“{item.custom.giftMessage}”</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-line mt-4 grid gap-10 border-t pt-8 sm:grid-cols-2">
          <div className="space-y-6 text-sm">
            <div>
              <p className="field-label">Delivering to</p>
              <address className="leading-relaxed not-italic">
                {order.name}
                <br />
                {address.line1}
                {address.line2 && (
                  <>
                    <br />
                    {address.line2}
                  </>
                )}
                <br />
                {address.city}, {address.state} {address.postalCode}
                <br />
                {address.country}
                <br />
                {order.phone}
              </address>
            </div>
            <div>
              <p className="field-label">Payment</p>
              <p>
                {order.paymentMethod === "cod" ? "Cash on delivery" : "Online payment"} ·{" "}
                {order.paymentMethod === "cod" && order.paymentStatus === "pending"
                  ? "Pay on delivery"
                  : PAYMENT_LABEL[order.paymentStatus]}
              </p>
            </div>
          </div>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums">{money(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Discount{order.couponCode && ` (${order.couponCode})`}</dt>
                <dd className="tabular-nums">−{money(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd className="tabular-nums">{order.shipping ? money(order.shipping) : "Free"}</dd>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Tax</dt>
                <dd className="tabular-nums">{money(order.tax)}</dd>
              </div>
            )}
            <div className="border-line flex justify-between border-t pt-4 text-base">
              <dt className="tracking-widest uppercase">Total</dt>
              <dd className="text-xl tabular-nums">{money(order.total)}</dd>
            </div>
          </dl>
        </section>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn btn-primary">
            Continue shopping
          </Link>
          <Link href="/contact" className="btn btn-outline">
            Need help?
          </Link>
        </div>
      </div>
    </div>
  );
}
