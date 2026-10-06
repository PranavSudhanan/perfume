import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import { CrudTable } from "@/components/admin/crud";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { deleteCouponAction, saveCouponAction } from "@/lib/actions/admin";
import { adminPage } from "@/lib/admin";
import { couponFields } from "@/lib/admin-fields";
import { getSettings } from "@/lib/data";
import { formatMoney, isPast } from "@/lib/utils";

export const metadata: Metadata = { title: "Discount codes" };

/** `YYYY-MM-DDTHH:mm` in UTC, the format a datetime-local input expects. */
const toInput = (date: Date | null) => (date ? date.toISOString().slice(0, 16) : "");

export default async function CouponsPage() {
  await adminPage();
  const [{ store }, rows] = await Promise.all([
    getSettings(),
    db.select().from(coupons).orderBy(desc(coupons.createdAt)),
  ]);

  return (
    <>
      <PageHeader
        title="Discount codes"
        description="Codes customers can enter in their bag or at checkout. Expiry times are in UTC."
      />
      <CrudTable
        noun="discount code"
        money={store}
        rows={rows.map((c) => ({
          id: c.id,
          code: c.code,
          type: c.type,
          percentOff: c.type === "percent" ? c.value : 0,
          amountOff: c.type === "fixed" ? c.value : 0,
          minSubtotal: c.minSubtotal,
          maxUses: c.maxUses ?? 0,
          expiresAt: toInput(c.expiresAt),
          active: c.active,
          // Display-only columns:
          summary: c.type === "percent" ? `${c.value}% off` : `${formatMoney(c.value, store)} off`,
          used: c.maxUses ? `${c.usedCount} / ${c.maxUses}` : String(c.usedCount),
          expiry: c.expiresAt
            ? isPast(c.expiresAt)
              ? "Expired"
              : toInput(c.expiresAt).replace("T", " ")
            : "Never",
        }))}
        columns={[
          { key: "code", label: "Code" },
          { key: "summary", label: "Discount" },
          { key: "minSubtotal", label: "Min. order", kind: "money" },
          { key: "used", label: "Used" },
          { key: "expiry", label: "Expires" },
          { key: "active", label: "Active", kind: "bool" },
        ]}
        fields={couponFields}
        newItem={{
          code: "",
          type: "percent",
          percentOff: 10,
          amountOff: 0,
          minSubtotal: 0,
          maxUses: 0,
          expiresAt: "",
          active: true,
        }}
        saveAction={saveCouponAction}
        deleteAction={deleteCouponAction}
      />
    </>
  );
}
