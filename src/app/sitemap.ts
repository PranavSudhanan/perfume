import type { MetadataRoute } from "next";
import { getCatalog, getPublishedPageSlugs } from "@/lib/data";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, slugs] = await Promise.all([getCatalog(), getPublishedPageSlugs()]);
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/create`, changeFrequency: "monthly", priority: 0.8 },
    ...slugs.filter((slug) => slug !== "home").map((slug) => ({ url: `${base}/${slug}`, priority: 0.5 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, priority: 0.7 })),
  ];
}
