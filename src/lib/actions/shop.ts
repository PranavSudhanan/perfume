"use server";

import { randomInt } from "node:crypto";
import { and, eq, gte, isNull, lt, or, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import {
  coupons,
  messages,
  orderItems,
  orders,
  products,
  productVariants,
  reviews,
  subscribers,
  users,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getSettings, TAGS } from "@/lib/data";
import { buildQuote, MAX_LINES, MAX_QTY, type CartLineInput, type Quote } from "@/lib/pricing";
import {
  createGatewayOrder,
  razorpayConfigured,
  razorpayKeyId,
  verifyPaymentSignature,
} from "@/lib/razorpay";
import { fail, type ActionResult } from "@/lib/result";

const lineSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("product"),
    variantId: z.uuid(),
    qty: z.number().int().min(1).max(MAX_QTY),
  }),
  z.object({
    kind: z.literal("custom"),
    selections: z.record(z.string().max(40), z.array(z.uuid()).max(20)),
    labelText: z.string().max(60).optional(),
    giftMessage: z.string().max(300).optional(),
    qty: z.number().int().min(1).max(MAX_QTY),
  }),
]);
const linesSchema = z.array(lineSchema).max(MAX_LINES);
const couponSchema = z.string().trim().max(40).optional().nullable();
const emailSchema = z.email("Enter a valid email address.").trim().toLowerCase().max(200);

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

export async function quoteCartAction(lines: unknown, couponCode?: unknown): Promise<Quote> {
  const parsedLines = linesSchema.safeParse(lines);
  const parsedCoupon = couponSchema.safeParse(couponCode);
  return buildQuote(
    parsedLines.success ? (parsedLines.data as CartLineInput[]) : [],
    parsedCoupon.success ? parsedCoupon.data : null,
  );
}

const orderSchema = z.object({
  lines: linesSchema.min(1, "Your bag is empty."),
  couponCode: couponSchema,
  name: z.string().trim().min(2, "Enter your full name.").max(100),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{6,18}$/, "Enter a valid phone number."),
  address: z.object({
    line1: z.string().trim().min(3, "Enter your address.").max(200),
    line2: z.string().trim().max(200).optional(),
    city: z.string().trim().min(2, "Enter your city.").max(100),
    state: z.string().trim().min(2, "Enter your state.").max(100),
    postalCode: z.string().trim().min(3, "Enter your postal code.").max(12),
    country: z.string().trim().min(2, "Enter your country.").max(60),
  }),
  paymentMethod: z.enum(["cod", "razorpay"]),
  note: z.string().trim().max(500).optional(),
});

const ORDER_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function newOrderNumber(prefix: string) {
  let code = "";
  for (let i = 0; i < 7; i++) code += ORDER_ALPHABET[randomInt(ORDER_ALPHABET.length)];
  const clean = prefix.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
  return clean ? `${clean}-${code}` : code;
}

class OrderError extends Error {}

export async function placeOrderAction(input: unknown): Promise<ActionResult<{ orderId: string }>> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const data = parsed.data;

  const [{ checkout }, user] = await Promise.all([getSettings(), getCurrentUser()]);
  if (data.paymentMethod === "cod" && !checkout.codEnabled) {
    return fail("Cash on delivery is not available.");
  }
  if (data.paymentMethod === "razorpay" && !(checkout.onlineEnabled && razorpayConfigured())) {
    return fail("Online payment is not available right now.");
  }

  const quote = await buildQuote(data.lines as CartLineInput[], data.couponCode);
  const problem = quote.lines.find((l) => l.error);
  if (problem) return fail(`${problem.name}: ${problem.error}`);
  if (data.couponCode?.trim() && quote.couponError) return fail(quote.couponError);

  // Several cart lines can point at the same variant; reserve stock once per variant.
  const reserve = new Map<string, { qty: number; name: string }>();
  for (const line of quote.lines) {
    if (!line.variantId) continue;
    const entry = reserve.get(line.variantId) ?? { qty: 0, name: line.name };
    entry.qty += line.qty;
    reserve.set(line.variantId, entry);
  }

  try {
    const orderId = await db.transaction(async (tx) => {
      for (const [variantId, { qty, name }] of reserve) {
        const updated = await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} - ${qty}` })
          .where(and(eq(productVariants.id, variantId), gte(productVariants.stock, qty)))
          .returning({ id: productVariants.id });
        if (!updated.length) throw new OrderError(`Sorry, ${name} just sold out.`);
      }

      if (quote.couponCode) {
        const used = await tx
          .update(coupons)
          .set({ usedCount: sql`${coupons.usedCount} + 1` })
          .where(
            and(
              eq(coupons.code, quote.couponCode),
              eq(coupons.active, true),
              or(isNull(coupons.maxUses), lt(coupons.usedCount, coupons.maxUses)),
            ),
          )
          .returning({ id: coupons.id });
        if (!used.length) throw new OrderError("This discount code is no longer available.");
      }

      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber: newOrderNumber(checkout.orderPrefix),
          userId: user?.id ?? null,
          email: data.email,
          name: data.name,
          phone: data.phone,
          shippingAddress: data.address,
          subtotal: quote.subtotal,
          discount: quote.discount,
          shipping: quote.shipping,
          tax: quote.tax,
          total: quote.total,
          couponCode: quote.couponCode,
          paymentMethod: data.paymentMethod,
          customerNote: data.note || null,
        })
        .returning({ id: orders.id });

      await tx.insert(orderItems).values(
        quote.lines.map((line) => ({
          orderId: order.id,
          productId: line.productId,
          variantId: line.variantId,
          name: line.name,
          variantLabel: line.variantLabel,
          image: line.image,
          unitPrice: line.unitPrice,
          quantity: line.qty,
          custom: line.custom,
        })),
      );
      return order.id;
    });

    if (user && (!user.address || !user.phone)) {
      await db
        .update(users)
        .set({ address: user.address ?? data.address, phone: user.phone ?? data.phone })
        .where(eq(users.id, user.id));
    }
    if (reserve.size) updateTag(TAGS.catalog);
    return { ok: true, orderId };
  } catch (error) {
    if (error instanceof OrderError) return fail(error.message);
    console.error("placeOrder failed", error);
    return fail("We couldn't place your order. Please try again.");
  }
}

export type PaymentSession = {
  keyId: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  storeName: string;
  name: string;
  email: string;
  phone: string;
};

/** Opens (or reuses) a Razorpay order for an unpaid online-payment order. */
export async function startPaymentAction(orderId: unknown): Promise<ActionResult<PaymentSession>> {
  const id = z.uuid().safeParse(orderId);
  if (!id.success || !razorpayConfigured()) return fail("Online payment is not available.");
  const [order] = await db.select().from(orders).where(eq(orders.id, id.data)).limit(1);
  if (!order || order.paymentMethod !== "razorpay") return fail("Order not found.");
  if (order.paymentStatus === "paid") return fail("This order is already paid.");
  if (order.status === "cancelled") return fail("This order was cancelled.");

  const { store } = await getSettings();
  try {
    let gatewayOrderId = order.gatewayOrderId;
    if (!gatewayOrderId) {
      gatewayOrderId = await createGatewayOrder(order.total, store.currencyCode, order.orderNumber);
      await db.update(orders).set({ gatewayOrderId }).where(eq(orders.id, order.id));
    }
    return {
      ok: true,
      keyId: razorpayKeyId(),
      gatewayOrderId,
      amount: order.total,
      currency: store.currencyCode,
      storeName: store.name,
      name: order.name,
      email: order.email,
      phone: order.phone,
    };
  } catch (error) {
    console.error("startPayment failed", error);
    return fail("We couldn't reach the payment provider. Please try again.");
  }
}

export async function confirmPaymentAction(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({
      orderId: z.uuid(),
      gatewayOrderId: z.string().min(1).max(100),
      paymentId: z.string().min(1).max(100),
      signature: z.string().min(1).max(200),
    })
    .safeParse(input);
  if (!parsed.success) return fail("Invalid payment response.");
  const { orderId, gatewayOrderId, paymentId, signature } = parsed.data;

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || order.gatewayOrderId !== gatewayOrderId) return fail("Order not found.");
  if (!verifyPaymentSignature(gatewayOrderId, paymentId, signature)) {
    return fail("We couldn't verify this payment. If money was deducted, please contact us.");
  }
  await db
    .update(orders)
    .set({
      paymentStatus: "paid",
      gatewayPaymentId: paymentId,
      status: order.status === "pending" ? "confirmed" : order.status,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id));
  return { ok: true };
}

export async function trackOrderAction(input: unknown): Promise<ActionResult<{ orderId: string }>> {
  const parsed = z
    .object({ orderNumber: z.string().trim().toUpperCase().min(3).max(30), email: emailSchema })
    .safeParse(input);
  if (!parsed.success) return fail("Enter your order number and the email used at checkout.");
  const [order] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(eq(orders.orderNumber, parsed.data.orderNumber), eq(orders.email, parsed.data.email)),
    )
    .limit(1);
  if (!order) return fail("We couldn't find an order with those details.");
  return { ok: true, orderId: order.id };
}

/** `website` is a honeypot: real visitors never see or fill it. */
const honeypot = z.string().max(200).optional();

export async function submitReviewAction(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({
      productId: z.uuid(),
      name: z.string().trim().min(2, "Enter your name.").max(60),
      rating: z.number().int().min(1).max(5),
      title: z.string().trim().max(100).optional(),
      body: z.string().trim().min(10, "Tell us a little more (10+ characters).").max(1500),
      website: honeypot,
    })
    .safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { website, productId, ...review } = parsed.data;
  if (website) return { ok: true };

  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.active, true)));
  if (!product) return fail("Product not found.");
  const user = await getCurrentUser();
  await db.insert(reviews).values({
    productId,
    userId: user?.id ?? null,
    name: review.name,
    rating: review.rating,
    title: review.title || null,
    body: review.body,
  });
  return { ok: true };
}

export async function subscribeAction(input: unknown): Promise<ActionResult> {
  const parsed = z.object({ email: emailSchema, website: honeypot }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  if (parsed.data.website) return { ok: true };
  await db.insert(subscribers).values({ email: parsed.data.email }).onConflictDoNothing();
  return { ok: true };
}

export async function sendMessageAction(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Enter your name.").max(100),
      email: emailSchema,
      subject: z.string().trim().max(150).optional(),
      body: z.string().trim().min(10, "Please write a slightly longer message.").max(4000),
      website: honeypot,
    })
    .safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { website, ...message } = parsed.data;
  if (website) return { ok: true };
  await db.insert(messages).values({ ...message, subject: message.subject || null });
  return { ok: true };
}
