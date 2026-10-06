import type { Metadata } from "next";
import { EntityForm } from "@/components/admin/crud";
import { PageHeader } from "@/components/admin/ui";
import { saveSettingsAction } from "@/lib/actions/admin";
import { adminPage } from "@/lib/admin";
import { navigationGroups } from "@/lib/admin-fields";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Menus & footer" };

export default async function NavigationPage() {
  await adminPage();
  const { navigation } = await getSettings();
  return (
    <>
      <PageHeader
        title="Menus & footer"
        description="The announcement bar, header menu and footer that appear on every page."
      />
      <EntityForm
        groups={navigationGroups}
        initial={navigation}
        action={saveSettingsAction.bind(null, "navigation")}
      />
    </>
  );
}
