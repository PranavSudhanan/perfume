import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton, PasswordForm, ProfileForm } from "@/components/store/account-forms";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { toCountries } from "@/lib/geo";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/account/login");

  const [{ store, checkout }, myOrders] = await Promise.all([
    getSettings(),
    db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      orderBy: [desc(orders.createdAt)],
      with: { items: true },
      limit: 50,
    }),
  ]);

  return (
    <div className="container-page py-12 md:py-16">
      <header className="mb-12 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">My account</p>
          <h1 className="heading text-5xl md:text-6xl">Hello, {user.name.split(" ")[0]}</h1>
          <p className="text-muted mt-2">{user.email}</p>
        </div>
        <div className="flex gap-3">
          {user.role === "admin" && (
            <Link href="/admin" className="btn btn-primary btn-sm">
              Admin panel
            </Link>
          )}
          <LogoutButton />
        </div>
      </header>

      <div className="grid gap-14 lg:grid-cols-[1fr_420px] lg:gap-20">
        <section>
          <h2 className="heading mb-6 text-3xl">Orders</h2>
          {myOrders.length === 0 ? (
            <div className="border-line rounded-theme border p-10 text-center">
              <p className="text-muted">You haven’t placed an order yet.</p>
              <Link href="/shop" className="btn btn-primary mt-6">
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="border-line divide-line divide-y border-y">
              {myOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/order/${order.id}`}
                    className="hover:bg-surface -mx-3 flex flex-wrap items-center justify-between gap-4 px-3 py-5 transition"
                  >
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-muted text-sm">
                        {formatDate(order.createdAt, store.locale)} ·{" "}
                        {order.items.reduce((n, i) => n + i.quantity, 0)} item(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums">{formatMoney(order.total, store)}</p>
                      <p className="text-accent text-xs tracking-widest uppercase">{order.status}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-12">
          <section>
            <h2 className="heading mb-6 text-3xl">Your details</h2>
            <ProfileForm
              user={{ name: user.name, phone: user.phone, address: user.address }}
              countries={toCountries(checkout.shipCountries)}
            />
          </section>
          <section>
            <h2 className="heading mb-6 text-3xl">Password</h2>
            <PasswordForm />
          </section>
        </aside>
      </div>
    </div>
  );
}
