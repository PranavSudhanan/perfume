import { asc, eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageEditor, type EditablePage } from "@/components/admin/page-editor";
import { PageHeader, ui } from "@/components/admin/ui";
import { db } from "@/db";
import { categories, pages } from "@/db/schema";
import { adminPage } from "@/lib/admin";

export const metadata: Metadata = { title: "Edit page" };

const BLANK: EditablePage = {
  slug: "",
  title: "",
  sections: [],
  published: true,
  seoTitle: "",
  seoDescription: "",
};

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  await adminPage();
  const { id } = await params;
  const isNew = id === "new";
  if (!isNew && !z.uuid().safeParse(id).success) notFound();

  const [row, collections] = await Promise.all([
    isNew ? null : db.query.pages.findFirst({ where: eq(pages.id, id) }),
    db
      .select({ value: categories.id, label: categories.name })
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
  ]);
  if (!isNew && !row) notFound();

  const page: EditablePage = row
    ? {
        id: row.id,
        slug: row.slug,
        title: row.title,
        sections: row.sections,
        published: row.published,
        seoTitle: row.seoTitle ?? "",
        seoDescription: row.seoDescription ?? "",
      }
    : BLANK;
  const path = page.slug === "home" ? "/" : `/${page.slug}`;

  return (
    <>
      <PageHeader title={row ? row.title : "New page"} back={{ href: "/admin/pages", label: "Pages" }}>
        {row?.published && (
          <a href={path} target="_blank" rel="noopener noreferrer" className={ui.btnSecondary}>
            <ExternalLink className="size-4" /> View page
          </a>
        )}
      </PageHeader>
      {/* Remount when switching between pages so editor state never leaks across them. */}
      <PageEditor key={page.id ?? "new"} page={page} sources={{ categories: collections }} />
    </>
  );
}
