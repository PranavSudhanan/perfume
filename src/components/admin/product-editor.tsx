import { asc } from "drizzle-orm";
import { EntityForm } from "@/components/admin/crud";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { deleteProductAction, saveProductAction } from "@/lib/actions/admin";
import { productGroups } from "@/lib/admin-fields";

const BLANK = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  categoryId: "",
  badge: "",
  images: [],
  variants: [{ label: "50 ml", sku: "", price: 0, compareAtPrice: 0, stock: 0 }],
  gender: "unisex",
  concentration: "Eau de Parfum",
  scentFamily: "",
  topNotes: [],
  heartNotes: [],
  baseNotes: [],
  active: true,
  featured: false,
  seoTitle: "",
  seoDescription: "",
};

/** The product form, shared by the "new" and "edit" pages. */
export async function ProductEditor({ product }: { product?: Record<string, unknown> & { id: string } }) {
  const options = await db
    .select({ value: categories.id, label: categories.name })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return (
    <EntityForm
      groups={productGroups}
      initial={product ?? BLANK}
      sources={{ categories: options }}
      action={saveProductAction}
      slugFrom="name"
      redirectTo="/admin/products/{id}"
      deleteAction={product ? deleteProductAction.bind(null, product.id) : undefined}
      deleteRedirect="/admin/products"
      submitLabel={product ? "Save product" : "Create product"}
    />
  );
}
