import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, type Delivery, type OrderNotifications } from "@/db/schema";
import { getSettings } from "@/lib/data";
import {
  attempt,
  deliverEmail,
  previewMode,
  publicBaseUrl,
  replyAddress,
  saveToOutbox,
  skipped,
} from "./deliver";
import { sendSms, smsProvider } from "./sms";
import { orderEmail, orderSms, shippingEmail, type ShippingStage } from "./templates";

/** Records delivery outcomes on the order without disturbing the ones already there. */
async function record(orderId: string, outcome: OrderNotifications, extra: { confirmed?: boolean } = {}) {
  await db
    .update(orders)
    .set({
      notifications: sql`coalesce(${orders.notifications}, '{}'::jsonb) || ${JSON.stringify(outcome)}::jsonb`,
      ...(extra.confirmed ? { confirmationSentAt: new Date() } : {}),
    })
    .where(eq(orders.id, orderId));
}

function logFailures(orderNumber: string, outcome: OrderNotifications) {
  for (const [channel, result] of Object.entries(outcome)) {
    if (result?.status === "failed") {
      console.error(`Order ${orderNumber}: ${channel} message failed: ${result.detail}`);
    }
  }
}

/**
 * Emails and texts the customer their order confirmation and records the outcome
 * on the order. Safe to call from several places (checkout, payment callback,
 * payment webhook): only the first call sends, unless `force` is set.
 * Never throws — a notification problem must not fail an order.
 */
export async function sendOrderConfirmation(
  orderId: string,
  { force = false }: { force?: boolean } = {},
): Promise<OrderNotifications | null> {
  try {
    if (!force) {
      const claimed = await db
        .update(orders)
        .set({ confirmationSentAt: new Date() })
        .where(and(eq(orders.id, orderId), isNull(orders.confirmationSentAt)))
        .returning({ id: orders.id });
      if (!claimed.length) return null;
    }

    const [order, settings, baseUrl] = await Promise.all([
      db.query.orders.findFirst({ where: eq(orders.id, orderId), with: { items: true } }),
      getSettings(),
      publicBaseUrl(),
    ]);
    if (!order) return null;
    const { store, checkout } = settings;

    const email = async (): Promise<Delivery> => {
      if (!checkout.confirmationEmail) return skipped("Turned off in Settings.");
      return deliverEmail({
        to: order.email,
        content: orderEmail(order, settings, baseUrl),
        fromName: store.name,
        replyTo: replyAddress(store.email),
        previewFile: `${order.orderNumber}-email.html`,
      });
    };

    const sms = async (): Promise<Delivery> => {
      if (!checkout.confirmationSms) return skipped("Turned off in Settings.");
      const body = orderSms(order, settings, baseUrl);
      if (previewMode()) {
        return saveToOutbox(`${order.orderNumber}-sms.txt`, `To: ${order.phone}\n\n${body}\n`);
      }
      if (!smsProvider()) return skipped("Text messages are not connected yet.");
      return attempt(() => sendSms(order.phone, body));
    };

    const [emailResult, smsResult] = await Promise.all([email(), sms()]);
    const outcome: OrderNotifications = { email: emailResult, sms: smsResult };
    await record(orderId, outcome, { confirmed: true });
    logFailures(order.orderNumber, outcome);
    return outcome;
  } catch (error) {
    console.error("sendOrderConfirmation failed", error);
    return null;
  }
}

/**
 * Emails the customer that their order has shipped (with tracking details) or
 * has been delivered, and records the outcome on the order. Never throws.
 */
export async function sendShippingUpdate(orderId: string, stage: ShippingStage): Promise<Delivery | null> {
  try {
    const [order, settings, baseUrl] = await Promise.all([
      db.query.orders.findFirst({ where: eq(orders.id, orderId), with: { items: true } }),
      getSettings(),
      publicBaseUrl(),
    ]);
    if (!order) return null;

    const result = settings.checkout.shippingEmail
      ? await deliverEmail({
          to: order.email,
          content: shippingEmail(order, settings, baseUrl, stage),
          fromName: settings.store.name,
          replyTo: replyAddress(settings.store.email),
          previewFile: `${order.orderNumber}-${stage}.html`,
        })
      : skipped("Turned off in Settings.");

    await record(orderId, { [stage]: result });
    logFailures(order.orderNumber, { [stage]: result });
    return result;
  } catch (error) {
    console.error("sendShippingUpdate failed", error);
    return null;
  }
}
