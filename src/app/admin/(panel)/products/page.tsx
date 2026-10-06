import { desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, EmptyState, PageHeader, Table, ui } from "@/components/admin/ui";
import { db } from "@/db";
import { products } from "@/db/schema";
import { adminPage } from "@/lib/admin";
import { getSettings } from "@/lib/data";
import { cn, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  await adminPage();
  const [{ store }, rows] = await Promise.all([
    getSettings(),
    db.query.products.findMany({
      with: { variants: true, category: true },
      orderBy: [desc(products.createdAt)],
    }),
  ]);

  return (
    <>
      <PageHeader title="Products" description={`${rows.length} product${rows.length === 1 ? "" : "s"} in your catalogue`}>
        <Link href="/admin/products/new" className={ui.btn}>
          <Plus className="size-4" /> Add product
        </Link>
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState title="No products yet" text="Add your first perfume to start selling.">
          <Link href="/admin/products/new" className={ui.btn}>
            Add product
          </Link>
        </EmptyState>
      ) : (
        <Table head={["Product", "Collection", "Price", "Stock", "Status"]}>
          {rows.map((product) => {
            const prices = product.variants.map((v) => v.price);
            const stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
            const low = product.variants.some((v) => v.stock <= 5);
            return (
              <tr key={product.id} className="transition hover:bg-zinc-50">
                <td className={ui.td}>
                  <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt=""
                        className="h-12 w-10 shrink-0 rounded-md border border-zinc-200 object-cover"
                      />
                    ) : (
                      <span className="h-12 w-10 shrink-0 rounded-md bg-zinc-100" />
                    )}
                    <span>
                      <span className="block font-medium text-zinc-900 hover:underline">{product.name}</span>
                      <span className="block text-xs text-zinc-400">/product/{product.slug}</span>
                    </span>
                  </Link>
                </td>
                <td className={ui.td}>{product.category?.name ?? <span className="text-zinc-300">—</span>}</td>
                <td className={cn(ui.td, "tabular-nums")}>
                  {prices.length ? (
                    <>
                      {formatMoney(Math.min(...prices), store)}
                      {prices.length > 1 && ` – ${formatMoney(Math.max(...prices), store)}`}
                    </>
                  ) : (
                    <span className="text-red-600">No sizes</span>
                  )}
                </td>
                <td className={ui.td}>
                  <span className="tabular-nums">{stock}</span>
                  {low && stock > 0 && <span className="ml-2 text-xs text-amber-700">low</span>}
                  {stock === 0 && <span className="ml-2 text-xs text-red-600">sold out</span>}
                </td>
                <td className={ui.td}>
                  <span className="flex flex-wrap gap-1">
                    <Badge tone={product.active ? "green" : "neutral"}>{product.active ? "Visible" : "Hidden"}</Badge>
                    {product.featured && <Badge tone="violet">Featured</Badge>}
                  </span>
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}
