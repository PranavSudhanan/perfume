import { asc, eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ProductEditor } from "@/components/admin/product-editor";
import { PageHeader, ui } from "@/components/admin/ui";
import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { adminPage } from "@/lib/admin";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await adminPage();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { variants: { orderBy: [asc(productVariants.sortOrder), asc(productVariants.price)] } },
  });
  if (!product) notFound();

  return (
    <>
      <PageHeader title={product.name} back={{ href: "/admin/products", label: "Products" }}>
        {product.active && (
          <a href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer" className={ui.btnSecondary}>
            <ExternalLink className="size-4" /> View in store
          </a>
        )}
      </PageHeader>
      <ProductEditor
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          tagline: product.tagline ?? "",
          description: product.description ?? "",
          categoryId: product.categoryId ?? "",
          badge: product.badge ?? "",
          images: product.images,
          variants: product.variants.map((v) => ({
            id: v.id,
            label: v.label,
            sku: v.sku ?? "",
            price: v.price,
            compareAtPrice: v.compareAtPrice ?? 0,
            stock: v.stock,
          })),
          gender: product.gender,
          concentration: product.concentration ?? "",
          scentFamily: product.scentFamily ?? "",
          topNotes: product.topNotes,
          heartNotes: product.heartNotes,
          baseNotes: product.baseNotes,
          active: product.active,
          featured: product.featured,
          seoTitle: product.seoTitle ?? "",
          seoDescription: product.seoDescription ?? "",
        }}
      />
    </>
  );
}
