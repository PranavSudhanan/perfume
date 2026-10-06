import { asc } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { CrudTable, EntityForm } from "@/components/admin/crud";
import { PageHeader, ui } from "@/components/admin/ui";
import { db } from "@/db";
import { builderOptions } from "@/db/schema";
import {
  deleteBuilderOptionAction,
  saveBuilderOptionAction,
  saveSettingsAction,
} from "@/lib/actions/admin";
import { adminPage } from "@/lib/admin";
import { builderGroups, builderOptionFields } from "@/lib/admin-fields";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Perfume builder" };

export default async function BuilderPage() {
  await adminPage();
  const [{ store, builder }, rows] = await Promise.all([
    getSettings(),
    db.select().from(builderOptions).orderBy(asc(builderOptions.sortOrder), asc(builderOptions.name)),
  ]);
  const steps = builder.steps.map((s) => ({ value: s.key, label: s.title }));
  // Options whose step was removed still need a tab so they can be reassigned or deleted.
  const orphaned = [...new Set(rows.map((r) => r.step))]
    .filter((key) => !steps.some((s) => s.value === key))
    .map((key) => ({ value: key, label: `${key} (no step)` }));

  return (
    <>
      <PageHeader
        title="Perfume builder"
        description="Everything customers can choose when composing their own perfume."
      >
        <a href="/create" target="_blank" rel="noopener noreferrer" className={ui.btnSecondary}>
          <ExternalLink className="size-4" /> Open builder
        </a>
      </PageHeader>

      <h2 className="mb-3 text-lg font-semibold">Options</h2>
      <CrudTable
        noun="option"
        money={store}
        tabs={{ key: "step", options: [...steps, ...orphaned] }}
        sources={{ steps: [...steps, ...orphaned] }}
        rows={rows.map((o) => ({
          id: o.id,
          step: o.step,
          name: o.name,
          description: o.description ?? "",
          family: o.family ?? "",
          color: o.color ?? "",
          image: o.image ?? "",
          priceDelta: o.priceDelta,
          sortOrder: o.sortOrder,
          active: o.active,
        }))}
        columns={[
          { key: "name", label: "Name" },
          { key: "family", label: "Family" },
          { key: "color", label: "Tint", kind: "color" },
          { key: "priceDelta", label: "Price", kind: "money" },
          { key: "active", label: "Available", kind: "bool" },
        ]}
        fields={builderOptionFields}
        newItem={{
          step: steps[0]?.value ?? "",
          name: "",
          description: "",
          family: "",
          color: "",
          image: "",
          priceDelta: 0,
          sortOrder: rows.length + 1,
          active: true,
        }}
        saveAction={saveBuilderOptionAction}
        deleteAction={deleteBuilderOptionAction}
      />

      <h2 className="mt-10 mb-3 text-lg font-semibold">Settings</h2>
      <EntityForm
        groups={builderGroups}
        initial={builder}
        action={saveSettingsAction.bind(null, "builder")}
        submitLabel="Save builder settings"
      />
    </>
  );
}
