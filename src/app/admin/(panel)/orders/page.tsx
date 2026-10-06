import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, EmptyState, ORDER_TONE, PageHeader, PAYMENT_TONE, Table, ui } from "@/components/admin/ui";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { adminPage } from "@/lib/admin";
import { getSettings } from "@/lib/data";
import { cn, formatDate, formatMoney, ORDER_STATUSES, type OrderStatus } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

const PAGE_SIZE = 30;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await adminPage();
  const params = await searchParams;
  const status = ORDER_STATUSES.includes(params.status as OrderStatus)
    ? (params.status as OrderStatus)
    : undefined;
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const where = and(
    status ? eq(orders.status, status) : undefined,
    q
      ? or(ilike(orders.orderNumber, `%${q}%`), ilike(orders.name, `%${q}%`), ilike(orders.email, `%${q}%`))
      : undefined,
  );
  const [{ store }, rows, [{ total }]] = await Promise.all([
    getSettings(),
    db
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: sql<number>`count(*)::int` }).from(orders).where(where),
  ]);

  const href = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ status, q, ...changes })) if (value) next.set(key, value);
    const qs = next.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };
  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <PageHeader title="Orders" description={`${total} order${total === 1 ? "" : "s"}`} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg bg-zinc-100 p-1">
          {[undefined, ...ORDER_STATUSES].map((s) => (
            <Link
              key={s ?? "all"}
              href={href({ status: s, page: undefined })}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition",
                status === s ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900",
              )}
            >
              {s ?? "All"}
            </Link>
          ))}
        </div>
        <form action="/admin/orders" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Order no., name or email"
            aria-label="Search orders"
            className={cn(ui.input, "w-60")}
          />
          <button type="submit" className={ui.btnSecondary}>
            Search
          </button>
        </form>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No orders found" text="Orders appear here as soon as customers check out." />
      ) : (
        <Table head={["Order", "Date", "Customer", "Payment", "Status", "Total"]}>
          {rows.map((order) => (
            <tr key={order.id} className="transition hover:bg-zinc-50">
              <td className={ui.td}>
                <Link href={`/admin/orders/${order.id}`} className="font-medium text-zinc-900 hover:underline">
                  {order.orderNumber}
                </Link>
              </td>
              <td className={ui.td}>{formatDate(order.createdAt, store.locale)}</td>
              <td className={ui.td}>
                {order.name}
                <span className="block text-xs text-zinc-400">{order.email}</span>
              </td>
              <td className={ui.td}>
                <Badge tone={PAYMENT_TONE[order.paymentStatus]}>{order.paymentStatus}</Badge>
                <span className="ml-2 text-xs text-zinc-400 uppercase">
                  {order.paymentMethod === "cod" ? "COD" : "Online"}
                </span>
              </td>
              <td className={ui.td}>
                <Badge tone={ORDER_TONE[order.status]}>{order.status}</Badge>
              </td>
              <td className={cn(ui.td, "font-medium tabular-nums")}>{formatMoney(order.total, store)}</td>
            </tr>
          ))}
        </Table>
      )}

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
          <span>
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={href({ page: String(page - 1) })} className={ui.btnSecondary}>
                Previous
              </Link>
            )}
            {page < pages && (
              <Link href={href({ page: String(page + 1) })} className={ui.btnSecondary}>
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
