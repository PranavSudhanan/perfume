import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db } from "@/db";
import {
  builderOptions,
  categories,
  pages,
  products,
  reviews,
  settings,
  type SectionData,
} from "@/db/schema";
import { resolveSettings, type SiteSettings } from "./config";

/**
 * Storefront reads go through Next's data cache so pages don't hit Postgres on
 * every request. Admin actions clear the matching tag (see lib/actions/admin.ts);
 * the timed revalidation is a safety net for changes made outside the app.
 */
const REVALIDATE_SECONDS = 300;

export const TAGS = {
  settings: "settings",
  pages: "pages",
  catalog: "catalog",
  builder: "builder",
} as const;

export const getSettings: () => Promise<SiteSettings> = cache(
  unstable_cache(
    async () => resolveSettings(await db.select().from(settings)),
    ["settings"],
    { tags: [TAGS.settings], revalidate: REVALIDATE_SECONDS },
  ),
);

export type PageContent = {
  id: string;
  slug: string;
  title: string;
  sections: SectionData[];
  seoTitle: string | null;
  seoDescription: string | null;
};

export const getPage: (slug: string) => Promise<PageContent | null> = cache(
  unstable_cache(
    async (slug: string) => {
      const [page] = await db
        .select({
          id: pages.id,
          slug: pages.slug,
          title: pages.title,
          sections: pages.sections,
          seoTitle: pages.seoTitle,
          seoDescription: pages.seoDescription,
        })
        .from(pages)
        .where(and(eq(pages.slug, slug), eq(pages.published, true)))
        .limit(1);
      return page ?? null;
    },
    ["page"],
    { tags: [TAGS.pages], revalidate: REVALIDATE_SECONDS },
  ),
);

export const getPublishedPageSlugs = unstable_cache(
  async () =>
    (await db.select({ slug: pages.slug }).from(pages).where(eq(pages.published, true))).map(
      (p) => p.slug,
    ),
  ["page-slugs"],
  { tags: [TAGS.pages], revalidate: REVALIDATE_SECONDS },
);

export type CategoryCard = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
};

export const getCategories: () => Promise<CategoryCard[]> = cache(
  unstable_cache(
    async () =>
      db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
          image: categories.image,
        })
        .from(categories)
        .where(eq(categories.active, true))
        .orderBy(asc(categories.sortOrder), asc(categories.name)),
    ["categories"],
    { tags: [TAGS.catalog], revalidate: REVALIDATE_SECONDS },
  ),
);

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  image: string | null;
  hoverImage: string | null;
  badge: string | null;
  gender: string;
  scentFamily: string | null;
  categoryId: string | null;
  categoryName: string | null;
  notes: string[];
  priceFrom: number;
  compareAt: number | null;
  inStock: boolean;
  featured: boolean;
  rating: number | null;
  reviewCount: number;
  createdAt: string;
};

async function ratingSummary() {
  const rows = await db
    .select({
      productId: reviews.productId,
      rating: sql<number>`avg(${reviews.rating})::float`,
      count: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(eq(reviews.approved, true))
    .groupBy(reviews.productId);
  return new Map(rows.map((r) => [r.productId, r]));
}

/** The whole active catalogue as cards. It is small, so the shop filters and sorts it in memory. */
export const getCatalog: () => Promise<ProductCardData[]> = cache(
  unstable_cache(
    async () => {
      const [rows, ratings] = await Promise.all([
        db.query.products.findMany({
          where: eq(products.active, true),
          with: { variants: true, category: true },
          orderBy: [desc(products.createdAt)],
        }),
        ratingSummary(),
      ]);
      return rows
        .filter((p) => p.variants.length > 0)
        .map((p) => {
          const cheapest = [...p.variants].sort((a, b) => a.price - b.price)[0];
          const rating = ratings.get(p.id);
          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            tagline: p.tagline,
            image: p.images[0] ?? null,
            hoverImage: p.images[1] ?? null,
            badge: p.badge,
            gender: p.gender,
            scentFamily: p.scentFamily,
            categoryId: p.categoryId,
            categoryName: p.category?.name ?? null,
            notes: [...p.topNotes, ...p.heartNotes, ...p.baseNotes],
            priceFrom: cheapest.price,
            compareAt:
              cheapest.compareAtPrice && cheapest.compareAtPrice > cheapest.price
                ? cheapest.compareAtPrice
                : null,
            inStock: p.variants.some((v) => v.stock > 0),
            featured: p.featured,
            rating: rating ? Math.round(rating.rating * 10) / 10 : null,
            reviewCount: rating?.count ?? 0,
            createdAt: p.createdAt.toISOString(),
          };
        });
    },
    ["catalog"],
    { tags: [TAGS.catalog], revalidate: REVALIDATE_SECONDS },
  ),
);

export type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  images: string[];
  gender: string;
  concentration: string | null;
  scentFamily: string | null;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  badge: string | null;
  categoryId: string | null;
  category: { name: string; slug: string } | null;
  seoTitle: string | null;
  seoDescription: string | null;
  variants: {
    id: string;
    label: string;
    price: number;
    compareAtPrice: number | null;
    stock: number;
  }[];
  reviews: {
    id: string;
    name: string;
    rating: number;
    title: string | null;
    body: string;
    createdAt: string;
  }[];
};

export const getProduct: (slug: string) => Promise<ProductDetail | null> = cache(
  unstable_cache(
    async (slug: string) => {
      const p = await db.query.products.findFirst({
        where: and(eq(products.slug, slug), eq(products.active, true)),
        with: {
          category: true,
          variants: true,
          reviews: { where: eq(reviews.approved, true), orderBy: [desc(reviews.createdAt)] },
        },
      });
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        tagline: p.tagline,
        description: p.description,
        images: p.images,
        gender: p.gender,
        concentration: p.concentration,
        scentFamily: p.scentFamily,
        topNotes: p.topNotes,
        heartNotes: p.heartNotes,
        baseNotes: p.baseNotes,
        badge: p.badge,
        categoryId: p.categoryId,
        category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        variants: [...p.variants]
          .sort((a, b) => a.sortOrder - b.sortOrder || a.price - b.price)
          .map((v) => ({
            id: v.id,
            label: v.label,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            stock: v.stock,
          })),
        reviews: p.reviews.map((r) => ({
          id: r.id,
          name: r.name,
          rating: r.rating,
          title: r.title,
          body: r.body,
          createdAt: r.createdAt.toISOString(),
        })),
      };
    },
    ["product"],
    { tags: [TAGS.catalog], revalidate: REVALIDATE_SECONDS },
  ),
);

export type BuilderChoice = {
  id: string;
  step: string;
  name: string;
  description: string | null;
  family: string | null;
  color: string | null;
  image: string | null;
  priceDelta: number;
};

export const getBuilderChoices: () => Promise<BuilderChoice[]> = cache(
  unstable_cache(
    async () =>
      db
        .select({
          id: builderOptions.id,
          step: builderOptions.step,
          name: builderOptions.name,
          description: builderOptions.description,
          family: builderOptions.family,
          color: builderOptions.color,
          image: builderOptions.image,
          priceDelta: builderOptions.priceDelta,
        })
        .from(builderOptions)
        .where(eq(builderOptions.active, true))
        .orderBy(asc(builderOptions.sortOrder), asc(builderOptions.name)),
    ["builder-options"],
    { tags: [TAGS.builder], revalidate: REVALIDATE_SECONDS },
  ),
);
