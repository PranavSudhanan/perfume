import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { CrudTable } from "@/components/admin/crud";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { deleteCategoryAction, saveCategoryAction } from "@/lib/actions/admin";
import { adminPage } from "@/lib/admin";
import { categoryFields } from "@/lib/admin-fields";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Collections" };

export default async function CategoriesPage() {
  await adminPage();
  const [{ store }, rows] = await Promise.all([
    getSettings(),
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
  ]);

  return (
    <>
      <PageHeader
        title="Collections"
        description="Groups of products shown in the shop filters and on the home page."
      />
      <CrudTable
        noun="collection"
        money={store}
        slugFrom="name"
        rows={rows.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description ?? "",
          image: c.image ?? "",
          sortOrder: c.sortOrder,
          active: c.active,
        }))}
        columns={[
          { key: "image", label: "", kind: "image" },
          { key: "name", label: "Name" },
          { key: "slug", label: "URL slug" },
          { key: "sortOrder", label: "Order", kind: "number" },
          { key: "active", label: "Visible", kind: "bool" },
        ]}
        fields={categoryFields}
        newItem={{ name: "", slug: "", description: "", image: "", sortOrder: rows.length + 1, active: true }}
        saveAction={saveCategoryAction}
        deleteAction={deleteCategoryAction}
      />
    </>
  );
}
