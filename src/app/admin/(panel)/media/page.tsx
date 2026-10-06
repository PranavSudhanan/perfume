import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import { MediaManager } from "@/components/admin/media-manager";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import { media } from "@/db/schema";
import { adminPage } from "@/lib/admin";

export const metadata: Metadata = { title: "Media library" };

export default async function MediaPage() {
  await adminPage();
  const rows = await db
    .select({ id: media.id, filename: media.filename, size: media.size })
    .from(media)
    .orderBy(desc(media.createdAt))
    .limit(300);

  return (
    <>
      <PageHeader
        title="Media library"
        description="Images you have uploaded. Pick them from any image field using the Library button."
      />
      <MediaManager items={rows.map((r) => ({ ...r, url: `/api/media/${r.id}` }))} />
    </>
  );
}
