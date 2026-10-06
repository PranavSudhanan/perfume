import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { verifyWebhookSignature } from "@/lib/razorpay";

type WebhookBody = {
  event?: string;
  payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
};

/**
 * Optional safety net: marks an order paid even if the customer closes the tab
 * before the browser confirms the payment. Point a Razorpay webhook for
 * `payment.captured` at /api/razorpay/webhook and set RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  const body = JSON.parse(raw) as WebhookBody;
  const payment = body.payload?.payment?.entity;
  if (body.event === "payment.captured" && payment?.order_id && payment.id) {
    const [order] = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(and(eq(orders.gatewayOrderId, payment.order_id), ne(orders.paymentStatus, "paid")))
      .limit(1);
    if (order) {
      await db
        .update(orders)
        .set({
          paymentStatus: "paid",
          gatewayPaymentId: payment.id,
          status: order.status === "pending" ? "confirmed" : order.status,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));
    }
  }
  return Response.json({ received: true });
}
