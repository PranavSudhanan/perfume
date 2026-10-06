import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RenderSections } from "@/components/sections";
import { getPage } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription ?? undefined,
  };
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params;
  // The home page is served at "/", not "/home".
  const page = slug === "home" ? null : await getPage(slug);
  if (!page) notFound();
  return <RenderSections sections={page.sections} />;
}
