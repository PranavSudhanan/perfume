import { asc } from "drizzle-orm";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, PageHeader, Table, ui } from "@/components/admin/ui";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { adminPage } from "@/lib/admin";
import { getSettings } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Pages & banners" };

export default async function PagesPage() {
  await adminPage();
  const [{ store }, rows] = await Promise.all([
    getSettings(),
    db.select().from(pages).orderBy(asc(pages.createdAt)),
  ]);
  // The home page always comes first.
  rows.sort((a, b) => Number(b.slug === "home") - Number(a.slug === "home"));

  return (
    <>
      <PageHeader
        title="Pages & banners"
        description="Build every page from sections — hero banners, product grids, text, FAQs and more."
      >
        <Link href="/admin/pages/new" className={ui.btn}>
          <Plus className="size-4" /> New page
        </Link>
      </PageHeader>
      <Table head={["Page", "URL", "Sections", "Status", "Last edited"]}>
        {rows.map((page) => {
          const home = page.slug === "home";
          return (
            <tr key={page.id} className="transition hover:bg-zinc-50">
              <td className={ui.td}>
                <Link href={`/admin/pages/${page.id}`} className="font-medium text-zinc-900 hover:underline">
                  {page.title}
                </Link>
                {home && <span className="ml-2 text-xs text-zinc-400">Home page — banners live here</span>}
              </td>
              <td className={`${ui.td} font-mono text-xs`}>{home ? "/" : `/${page.slug}`}</td>
              <td className={`${ui.td} tabular-nums`}>{page.sections.length}</td>
              <td className={ui.td}>
                <Badge tone={page.published ? "green" : "neutral"}>{page.published ? "Published" : "Draft"}</Badge>
              </td>
              <td className={ui.td}>{formatDate(page.updatedAt, store.locale)}</td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
