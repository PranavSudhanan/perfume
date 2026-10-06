import type { Metadata } from "next";
import { ProductEditor } from "@/components/admin/product-editor";
import { PageHeader } from "@/components/admin/ui";
import { adminPage } from "@/lib/admin";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await adminPage();
  return (
    <>
      <PageHeader title="New product" back={{ href: "/admin/products", label: "Products" }} />
      <ProductEditor />
    </>
  );
}
