import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ActionButton, EntityForm } from "@/components/admin/crud";
import { Badge, Card, ORDER_TONE, PageHeader, PAYMENT_TONE } from "@/components/admin/ui";
import { Bottle } from "@/components/store/bottle";
import { db } from "@/db";
import { orders, type Delivery } from "@/db/schema";
import {
  resendOrderConfirmationAction,
  sendShippingUpdateAction,
  updateOrderAction,
} from "@/lib/actions/admin";
import { adminPage } from "@/lib/admin";
import { orderGroups } from "@/lib/admin-fields";
import { getSettings } from "@/lib/data";
import { formatDateTime, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Order" };

const DELIVERY_TONE = { sent: "green", failed: "red", skipped: "neutral" } as const;
const DELIVERY_TEXT = { sent: "Sent", failed: "Failed", skipped: "Not sent" } as const;

function DeliveryRow({ label, to, delivery }: { label: string; to: string; delivery?: Delivery }) {
  return (
    <li>
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-zinc-900">{label}</span>
        <Badge tone={delivery ? DELIVERY_TONE[delivery.status] : "neutral"}>
          {delivery ? DELIVERY_TEXT[delivery.status] : "Not sent yet"}
        </Badge>
      </div>
      <p className="truncate text-xs text-zinc-500">{to}</p>
      {delivery?.detail && <p className="mt-0.5 text-xs text-zinc-500">{delivery.detail}</p>}
    </li>
  );
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  await adminPage();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [order, { store }] = await Promise.all([
    db.query.orders.findFirst({ where: eq(orders.id, id), with: { items: true } }),
    getSettings(),
  ]);
  if (!order) notFound();
  const money = (minor: number) => formatMoney(minor, store);
  const a = order.shippingAddress;

  return (
    <>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed ${formatDateTime(order.createdAt, store.locale)}`}
        back={{ href: "/admin/orders", label: "Orders" }}
      >
        <Badge tone={PAYMENT_TONE[order.paymentStatus]}>Payment: {order.paymentStatus}</Badge>
        <Badge tone={ORDER_TONE[order.status]}>{order.status}</Badge>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title="Items">
            <ul className="-my-3 divide-y divide-zinc-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-4">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                    {item.custom ? (
                      <Bottle
                        color={item.custom.liquidColor}
                        label={item.custom.labelText}
                        className="h-full w-full p-1"
                      />
                    ) : item.image ? (
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="flex justify-between gap-4">
                      <p className="font-medium text-zinc-900">{item.name}</p>
                      <p className="shrink-0 font-medium tabular-nums">
                        {money(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                    <p className="text-zinc-500">
                      {[item.variantLabel, `${item.quantity} × ${money(item.unitPrice)}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {item.custom && (
                      <dl className="mt-2 rounded-lg bg-amber-50 p-3 text-[13px]">
                        <p className="mb-1 text-xs font-semibold tracking-wide text-amber-800 uppercase">
                          Blend sheet
                        </p>
                        {item.custom.selections.map((s) => (
                          <div key={s.step} className="flex gap-2">
                            <dt className="shrink-0 text-zinc-500">{s.title}:</dt>
                            <dd className="font-medium text-zinc-900">{s.options.join(", ")}</dd>
                          </div>
                        ))}
                        {item.custom.labelText && (
                          <div className="flex gap-2">
                            <dt className="shrink-0 text-zinc-500">Label text:</dt>
                            <dd className="font-medium text-zinc-900">“{item.custom.labelText}”</dd>
                          </div>
                        )}
                        {item.custom.giftMessage && (
                          <div className="flex gap-2">
                            <dt className="shrink-0 text-zinc-500">Gift message:</dt>
                            <dd className="text-zinc-900 italic">“{item.custom.giftMessage}”</dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-5 ml-auto max-w-xs space-y-1.5 border-t border-zinc-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Subtotal</dt>
                <dd className="tabular-nums">{money(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Discount{order.couponCode && ` (${order.couponCode})`}</dt>
                  <dd className="tabular-nums">−{money(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-zinc-500">Shipping</dt>
                <dd className="tabular-nums">{order.shipping ? money(order.shipping) : "Free"}</dd>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Tax</dt>
                  <dd className="tabular-nums">{money(order.tax)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{money(order.total)}</dd>
              </div>
            </dl>
          </Card>

          <EntityForm
            groups={orderGroups}
            action={updateOrderAction}
            submitLabel="Update order"
            initial={{
              id: order.id,
              status: order.status,
              paymentStatus: order.paymentStatus,
              trackingNumber: order.trackingNumber ?? "",
              trackingUrl: order.trackingUrl ?? "",
              adminNote: order.adminNote ?? "",
            }}
          />
        </div>

        <div className="space-y-5">
          <Card title="Customer">
            <div className="space-y-1 text-sm">
              <p className="font-medium text-zinc-900">{order.name}</p>
              <p>
                <a href={`mailto:${order.email}`} className="text-zinc-600 hover:underline">
                  {order.email}
                </a>
              </p>
              <p>
                <a href={`tel:${order.phone}`} className="text-zinc-600 hover:underline">
                  {order.phone}
                </a>
              </p>
              <p className="pt-1 text-xs text-zinc-400">
                {order.userId ? "Registered customer" : "Guest checkout"}
              </p>
            </div>
          </Card>
          <Card title="Messages to the customer">
            <ul className="space-y-3 text-sm">
              <DeliveryRow label="Confirmation email" to={order.email} delivery={order.notifications?.email} />
              <DeliveryRow label="Confirmation text" to={order.phone} delivery={order.notifications?.sms} />
              <DeliveryRow label="Shipping email" to={order.email} delivery={order.notifications?.shipped} />
              <DeliveryRow label="Delivery email" to={order.email} delivery={order.notifications?.delivered} />
            </ul>
            <p className="mt-3 text-xs text-zinc-500">
              {!order.confirmationSentAt && order.paymentMethod === "razorpay"
                ? "The confirmation is sent automatically once the online payment is received. "
                : ""}
              The shipping and delivery emails go out when you set the status to Shipped or Delivered.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionButton
                action={resendOrderConfirmationAction.bind(null, order.id)}
                confirm="Send the order confirmation to this customer now?"
              >
                {order.confirmationSentAt ? "Resend confirmation" : "Send confirmation"}
              </ActionButton>
              {/* Offered once the order has reached that stage, e.g. to resend after adding a tracking link. */}
              {(order.status === "shipped" || order.status === "delivered") && (
                <ActionButton
                  action={sendShippingUpdateAction.bind(null, order.id, order.status)}
                  confirm={`Email the customer that this order has ${order.status === "shipped" ? "shipped" : "been delivered"}?`}
                >
                  {order.notifications?.[order.status] ? "Resend" : "Send"}{" "}
                  {order.status === "shipped" ? "shipping email" : "delivery email"}
                </ActionButton>
              )}
            </div>
          </Card>
          <Card title="Ship to">
            <address className="text-sm leading-relaxed text-zinc-700 not-italic">
              {order.name}
              <br />
              {a.line1}
              {a.line2 && (
                <>
                  <br />
                  {a.line2}
                </>
              )}
              <br />
              {a.city}, {a.state} {a.postalCode}
              <br />
              {a.country}
            </address>
          </Card>
          <Card title="Payment">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Method</dt>
                <dd>{order.paymentMethod === "cod" ? "Cash on delivery" : "Razorpay"}</dd>
              </div>
              {order.gatewayPaymentId && (
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Payment ID</dt>
                  <dd className="truncate font-mono text-xs">{order.gatewayPaymentId}</dd>
                </div>
              )}
            </dl>
          </Card>
          {order.customerNote && (
            <Card title="Customer note">
              <p className="text-sm whitespace-pre-wrap text-zinc-700">{order.customerNote}</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
