import { desc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { ActionButton } from "@/components/admin/crud";
import { Badge, EmptyState, PageHeader, Table, ui } from "@/components/admin/ui";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { setUserRoleAction } from "@/lib/actions/admin";
import { adminPage } from "@/lib/admin";
import { getSettings } from "@/lib/data";
import { cn, formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage() {
  const me = await adminPage();
  const [{ store }, rows] = await Promise.all([
    getSettings(),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
        orderCount: sql<number>`count(${orders.id})::int`,
        spent: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} <> 'cancelled'), 0)::float8`,
      })
      .from(users)
      .leftJoin(orders, eq(orders.userId, users.id))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt))
      .limit(500),
  ]);

  return (
    <>
      <PageHeader
        title="Customers"
        description="People with an account. Guest checkouts appear under Orders only."
      />
      {rows.length === 0 ? (
        <EmptyState title="No accounts yet" />
      ) : (
        <Table head={["Name", "Contact", "Joined", "Orders", "Spent", "Access", ""]}>
          {rows.map((user) => (
            <tr key={user.id}>
              <td className={cn(ui.td, "font-medium text-zinc-900")}>{user.name}</td>
              <td className={ui.td}>
                <a href={`mailto:${user.email}`} className="hover:underline">
                  {user.email}
                </a>
                {user.phone && <span className="block text-xs text-zinc-400">{user.phone}</span>}
              </td>
              <td className={ui.td}>{formatDate(user.createdAt, store.locale)}</td>
              <td className={cn(ui.td, "tabular-nums")}>{user.orderCount}</td>
              <td className={cn(ui.td, "tabular-nums")}>{formatMoney(user.spent, store)}</td>
              <td className={ui.td}>
                <Badge tone={user.role === "admin" ? "violet" : "neutral"}>{user.role}</Badge>
              </td>
              <td className={cn(ui.td, "text-right")}>
                {user.id === me.id ? (
                  <span className="text-xs text-zinc-400">You</span>
                ) : user.role === "admin" ? (
                  <ActionButton
                    action={setUserRoleAction.bind(null, user.id, "customer")}
                    confirm={`Remove admin access from ${user.name}?`}
                  >
                    Remove admin
                  </ActionButton>
                ) : (
                  <ActionButton
                    action={setUserRoleAction.bind(null, user.id, "admin")}
                    confirm={`Give ${user.name} full admin access to the store?`}
                  >
                    Make admin
                  </ActionButton>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
