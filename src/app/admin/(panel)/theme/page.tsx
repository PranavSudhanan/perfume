import type { Metadata } from "next";
import { ThemeEditor } from "@/components/admin/theme-editor";
import { PageHeader } from "@/components/admin/ui";
import { adminPage } from "@/lib/admin";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Theme" };

export default async function ThemePage() {
  await adminPage();
  const { theme, store } = await getSettings();
  return (
    <>
      <PageHeader
        title="Theme"
        description="Colours, fonts and shapes for the whole storefront. Changes go live when you publish."
      />
      <ThemeEditor initial={theme} storeName={store.name} />
    </>
  );
}
