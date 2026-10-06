import { SlidersHorizontal } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/store/product-card";
import { SortSelect } from "@/components/store/sort-select";
import { getCatalog, getCategories, getSettings, type ProductCardData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Shop perfumes",
  description: "Browse our collection of hand-blended perfumes.",
};

type Search = { q?: string; category?: string; gender?: string; family?: string; sort?: string };

const GENDERS = [
  { value: "women", label: "For her" },
  { value: "men", label: "For him" },
  { value: "unisex", label: "Unisex" },
];

const SORTS: Record<string, (a: ProductCardData, b: ProductCardData) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  "price-asc": (a, b) => a.priceFrom - b.priceFrom,
  "price-desc": (a, b) => b.priceFrom - a.priceFrom,
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  featured: (a, b) => Number(b.featured) - Number(a.featured),
};

function FilterGroup({
  title,
  options,
  active,
  hrefFor,
}: {
  title: string;
  options: { value: string; label: string; count: number }[];
  active?: string;
  hrefFor: (value: string | undefined) => string;
}) {
  if (!options.length) return null;
  return (
    <div>
      <p className="mb-3 text-xs font-medium tracking-[0.2em] uppercase">{title}</p>
      <ul className="space-y-2 text-sm">
        {options.map((option) => {
          const selected = active === option.value;
          return (
            <li key={option.value}>
              <Link
                href={hrefFor(selected ? undefined : option.value)}
                className={`flex items-center justify-between gap-3 transition ${selected ? "text-ink font-medium" : "text-muted hover:text-ink"}`}
                aria-current={selected ? "true" : undefined}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`border-line size-3.5 rounded-full border ${selected ? "bg-ink border-ink" : ""}`}
                  />
                  {option.label}
                </span>
                <span className="text-xs tabular-nums opacity-70">{option.count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const [catalog, categories, { store }] = await Promise.all([
    getCatalog(),
    getCategories(),
    getSettings(),
  ]);

  const category = categories.find((c) => c.slug === params.category);
  const query = params.q?.trim().toLowerCase() ?? "";
  const sort = params.sort && SORTS[params.sort] ? params.sort : "featured";

  const matches = (p: ProductCardData, skip?: keyof Search) =>
    (skip === "category" || !category || p.categoryId === category.id) &&
    (skip === "gender" || !params.gender || p.gender === params.gender) &&
    (skip === "family" || !params.family || p.scentFamily === params.family) &&
    (!query ||
      [p.name, p.tagline, p.scentFamily, p.categoryName, ...p.notes]
        .filter(Boolean)
        .some((text) => text!.toLowerCase().includes(query)));

  const products = catalog.filter((p) => matches(p)).sort(SORTS[sort]);

  const hrefWith = (changes: Partial<Search>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...params, ...changes })) {
      if (value) next.set(key, value);
    }
    const qs = next.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  // Counts for each facet ignore that facet's own filter, so options never dead-end.
  const count = (key: keyof Search, test: (p: ProductCardData) => boolean) =>
    catalog.filter((p) => matches(p, key) && test(p)).length;

  const families = [...new Set(catalog.map((p) => p.scentFamily).filter((f): f is string => !!f))].sort();
  const hasFilters = Boolean(params.category || params.gender || params.family || query);

  const filters = (
    <div className="space-y-8">
      <FilterGroup
        title="Collection"
        active={category?.slug}
        hrefFor={(value) => hrefWith({ category: value })}
        options={categories.map((c) => ({
          value: c.slug,
          label: c.name,
          count: count("category", (p) => p.categoryId === c.id),
        }))}
      />
      <FilterGroup
        title="Made for"
        active={params.gender}
        hrefFor={(value) => hrefWith({ gender: value })}
        options={GENDERS.map((g) => ({ ...g, count: count("gender", (p) => p.gender === g.value) }))}
      />
      <FilterGroup
        title="Scent family"
        active={params.family}
        hrefFor={(value) => hrefWith({ family: value })}
        options={families.map((f) => ({
          value: f,
          label: f,
          count: count("family", (p) => p.scentFamily === f),
        }))}
      />
      {hasFilters && (
        <Link href="/shop" className="link-underline inline-block text-sm">
          Clear all filters
        </Link>
      )}
    </div>
  );

  return (
    <div className="container-page py-12 md:py-16">
      <header className="mb-10 text-center md:mb-14">
        <p className="eyebrow mb-3">{query ? "Search results" : "The collection"}</p>
        <h1 className="heading text-5xl md:text-6xl">
          {query ? `“${params.q?.trim()}”` : (category?.name ?? "All perfumes")}
        </h1>
        {category?.description && !query && (
          <p className="text-muted mx-auto mt-4 max-w-xl leading-relaxed">{category.description}</p>
        )}
      </header>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-14">
        <aside className="hidden lg:block">{filters}</aside>

        <div>
          <div className="border-line mb-8 flex items-center justify-between gap-4 border-b pb-4">
            <p className="text-muted text-sm">
              {products.length} {products.length === 1 ? "perfume" : "perfumes"}
            </p>
            <SortSelect value={sort} />
          </div>

          <details className="border-line mb-8 border-b pb-4 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm tracking-widest uppercase [&::-webkit-details-marker]:hidden">
              <SlidersHorizontal className="size-4" strokeWidth={1.5} /> Filters
            </summary>
            <div className="pt-6">{filters}</div>
          </details>

          {products.length ? (
            <ProductGrid products={products} money={store} columns={3} />
          ) : (
            <div className="py-20 text-center">
              <p className="heading text-3xl">Nothing matches just yet</p>
              <p className="text-muted mt-3">Try removing a filter, or compose something of your own.</p>
              <div className="mt-8 flex justify-center gap-3">
                <Link href="/shop" className="btn btn-outline">
                  Clear filters
                </Link>
                <Link href="/create" className="btn btn-primary">
                  Create your own
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
