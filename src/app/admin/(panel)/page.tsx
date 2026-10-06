import { and, asc, desc, eq, gte, lt, lte, ne, sql } from "drizzle-orm";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import Link from "next/link";
import { RevenueChart, type DayPoint } from "@/components/admin/revenue-chart";
import { Badge, Card, ORDER_TONE, PageHeader, ui } from "@/components/admin/ui";
import { db } from "@/db";
import { orders, products, productVariants, users } from "@/db/schema";
import { adminPage } from "@/lib/admin";
import { getSettings } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/utils";

const DAY = 86_400_000;
const CHART_DAYS = 14;

const revenue = sql<number>`coalesce(sum(${orders.total}), 0)::float8`;
const count = sql<number>`count(*)::int`;
const notCancelled = ne(orders.status, "cancelled");

function Tile({
  label,
  value,
  delta,
  note,
}: {
  label: string;
  value: string;
  /** Change versus the previous period, as a fraction; null when there is no baseline. */
  delta?: number | null;
  note?: string;
}) {
  const Icon = !delta ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className={`${ui.card} p-5`}>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 tabular-nums">{value}</p>
      {delta !== undefined ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-zinc-500">
          {delta === null ? (
            "No earlier period to compare"
          ) : (
            <>
              <Icon
                className={`size-3.5 ${delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-600" : "text-zinc-400"}`}
              />
              <span className="font-medium text-zinc-700">
                {delta > 0 ? "+" : ""}
                {(delta * 100).toFixed(0)}%
              </span>
              vs previous 30 days
            </>
          )}
        </p>
      ) : (
        note && <p className="mt-1.5 text-xs text-zinc-500">{note}</p>
      )}
    </div>
  );
}

/** Reporting windows, measured from the moment the page is requested. */
function periods() {
  const now = Date.now();
  return {
    since30: new Date(now - 30 * DAY),
    since60: new Date(now - 60 * DAY),
    // Midnight UTC, CHART_DAYS - 1 days ago, so the chart ends with today.
    chartStart: new Date(Math.floor(now / DAY) * DAY - (CHART_DAYS - 1) * DAY),
  };
}

const change = (current: number, previous: number) =>
  previous > 0 ? (current - previous) / previous : null;

export default async function DashboardPage() {
  await adminPage();
  const { since30, since60, chartStart } = periods();
  const day = sql<string>`to_char(${orders.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`;

  const [{ store }, [current], [previous], [customers], [toFulfil], daily, recent, lowStock] =
    await Promise.all([
      getSettings(),
      db.select({ revenue, count }).from(orders).where(and(notCancelled, gte(orders.createdAt, since30))),
      db
        .select({ revenue, count })
        .from(orders)
        .where(and(notCancelled, gte(orders.createdAt, since60), lt(orders.createdAt, since30))),
      db.select({ count }).from(users).where(eq(users.role, "customer")),
      db
        .select({ count })
        .from(orders)
        .where(sql`${orders.status} in ('pending', 'confirmed', 'processing')`),
      db
        .select({ day, revenue, count })
        .from(orders)
        .where(and(notCancelled, gte(orders.createdAt, chartStart)))
        .groupBy(day),
      db.select().from(orders).orderBy(desc(orders.createdAt)).limit(6),
      db
        .select({
          id: productVariants.id,
          productId: products.id,
          name: products.name,
          label: productVariants.label,
          stock: productVariants.stock,
        })
        .from(productVariants)
        .innerJoin(products, eq(products.id, productVariants.productId))
        .where(and(eq(products.active, true), lte(productVariants.stock, 5)))
        .orderBy(asc(productVariants.stock))
        .limit(8),
    ]);

  // Fill days without orders so the chart shows a continuous fortnight.
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const series: DayPoint[] = Array.from({ length: CHART_DAYS }, (_, i) => {
    const key = new Date(chartStart.getTime() + i * DAY).toISOString().slice(0, 10);
    const row = byDay.get(key);
    return { day: key, revenue: row?.revenue ?? 0, orders: row?.count ?? 0 };
  });
  const average = current.count ? Math.round(current.revenue / current.count) : 0;

  return (
    <>
      <PageHeader title="Dashboard" description="How the store is doing over the last 30 days.">
        <Link href="/admin/products/new" className={ui.btnSecondary}>
          Add product
        </Link>
        <Link href="/admin/orders" className={ui.btn}>
          View orders
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Revenue"
          value={formatMoney(current.revenue, store)}
          delta={change(current.revenue, previous.revenue)}
        />
        <Tile label="Orders" value={String(current.count)} delta={change(current.count, previous.count)} />
        <Tile label="Average order value" value={formatMoney(average, store)} note="Excludes cancelled orders" />
        <Tile
          label="Orders to fulfil"
          value={String(toFulfil.count)}
          note={`${customers.count} registered customer${customers.count === 1 ? "" : "s"}`}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card title="Revenue per day" description={`Last ${CHART_DAYS} days, excluding cancelled orders`} className="lg:col-span-2">
          <RevenueChart data={series} money={store} />
        </Card>

        <Card
          title="Low stock"
          description="Sizes with 5 or fewer units left"
          actions={
            <Link href="/admin/products" className="text-sm text-zinc-500 hover:text-zinc-900">
              All products
            </Link>
          }
        >
          {lowStock.length === 0 ? (
            <p className="text-sm text-zinc-500">Everything is well stocked.</p>
          ) : (
            <ul className="-my-2 divide-y divide-zinc-100">
              {lowStock.map((v) => (
                <li key={v.id}>
                  <Link href={`/admin/products/${v.productId}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:opacity-70">
                    <span className="min-w-0 truncate">
                      {v.name} <span className="text-zinc-400">· {v.label}</span>
                    </span>
                    <Badge tone={v.stock === 0 ? "red" : "amber"}>
                      {v.stock === 0 ? "Sold out" : `${v.stock} left`}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card
        title="Recent orders"
        className="mt-5"
        actions={
          <Link href="/admin/orders" className="text-sm text-zinc-500 hover:text-zinc-900">
            All orders
          </Link>
        }
      >
        {recent.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No orders yet. Once customers check out, their orders appear here.
          </p>
        ) : (
          <ul className="-my-2 divide-y divide-zinc-100">
            {recent.map((order) => (
              <li key={order.id}>
                <Link href={`/admin/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm hover:opacity-70">
                  <span className="w-28 font-medium">{order.orderNumber}</span>
                  <span className="min-w-0 flex-1 truncate text-zinc-600">{order.name}</span>
                  <span className="text-zinc-500">{formatDate(order.createdAt, store.locale)}</span>
                  <Badge tone={ORDER_TONE[order.status]}>{order.status}</Badge>
                  <span className="w-24 text-right font-medium tabular-nums">{formatMoney(order.total, store)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
