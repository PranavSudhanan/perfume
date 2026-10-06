import { and, eq, ne, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/shell";
import { db } from "@/db";
import { messages, orders, reviews } from "@/db/schema";
import { adminPage } from "@/lib/admin";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

const count = sql<number>`count(*)::int`;

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await adminPage();
  const [{ store }, [pendingOrders], [pendingReviews], [unread]] = await Promise.all([
    getSettings(),
    db
      .select({ count })
      .from(orders)
      .where(and(eq(orders.status, "pending"), ne(orders.paymentStatus, "failed"))),
    db.select({ count }).from(reviews).where(eq(reviews.approved, false)),
    db.select({ count }).from(messages).where(eq(messages.read, false)),
  ]);

  return (
    <AdminShell
      storeName={store.name}
      user={{ name: user.name, email: user.email }}
      counts={{ orders: pendingOrders.count, reviews: pendingReviews.count, messages: unread.count }}
    >
      {children}
    </AdminShell>
  );
}
