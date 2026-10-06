import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/store/markdown";
import { ProductGrid, Stars } from "@/components/store/product-card";
import { ProductGallery, ProductPurchase, ReviewForm } from "@/components/store/product-client";
import { getCatalog, getProduct, getSettings } from "@/lib/data";
import { siteUrl } from "@/lib/site";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  const description = product.seoDescription || product.tagline || product.description?.slice(0, 160);
  return {
    title: product.seoTitle || product.name,
    description: description ?? undefined,
    openGraph: { images: product.images.slice(0, 1) },
  };
}

const GENDER_LABEL: Record<string, string> = { women: "For her", men: "For him", unisex: "Unisex" };

function Notes({ title, notes }: { title: string; notes: string[] }) {
  if (!notes.length) return null;
  return (
    <div>
      <p className="eyebrow mb-2">{title}</p>
      <p className="heading text-xl leading-snug">{notes.join(" · ")}</p>
    </div>
  );
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, catalog, { store, checkout, builder }] = await Promise.all([
    getProduct(slug),
    getCatalog(),
    getSettings(),
  ]);
  if (!product) notFound();

  const related = catalog
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
    .concat(catalog.filter((p) => p.id !== product.id && p.categoryId !== product.categoryId))
    .slice(0, 4);
  const reviewCount = product.reviews.length;
  const rating = reviewCount
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : null;
  const facts = [
    product.concentration,
    GENDER_LABEL[product.gender],
    product.scentFamily && `${product.scentFamily} family`,
  ].filter(Boolean);
  const hasNotes = product.topNotes.length + product.heartNotes.length + product.baseNotes.length > 0;

  // Structured data so search engines can show price, stock and rating.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.tagline ?? product.description ?? undefined,
    image: product.images.map((src) => (src.startsWith("/") ? siteUrl() + src : src)),
    brand: { "@type": "Brand", name: store.name },
    ...(rating && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: rating.toFixed(1), reviewCount },
    }),
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      name: v.label,
      price: (v.price / 100).toFixed(2),
      priceCurrency: store.currencyCode,
      availability: `https://schema.org/${v.stock > 0 ? "InStock" : "OutOfStock"}`,
      url: `${siteUrl()}/product/${product.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // "<" is escaped so product text can never close the script element.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="container-page py-8 md:py-12">
        <nav className="text-muted mb-6 text-xs tracking-widest uppercase" aria-label="Breadcrumb">
          <Link href="/shop" className="hover:text-ink">
            Shop
          </Link>
          {product.category && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/shop?category=${product.category.slug}`} className="hover:text-ink">
                {product.category.name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-10 md:grid-cols-2 md:gap-14 lg:gap-20">
          <ProductGallery images={product.images} name={product.name} />

          <div className="md:sticky md:top-28 md:self-start">
            {product.badge && <p className="eyebrow mb-3">{product.badge}</p>}
            <h1 className="heading text-5xl md:text-6xl">{product.name}</h1>
            {product.tagline && <p className="text-muted mt-3 text-lg">{product.tagline}</p>}
            {rating !== null && (
              <a href="#reviews" className="mt-4 inline-flex items-center gap-2 text-sm">
                <Stars rating={rating} />
                <span className="text-muted link-underline">
                  {rating.toFixed(1)} · {reviewCount} review{reviewCount === 1 ? "" : "s"}
                </span>
              </a>
            )}

            <div className="mt-7">
              <ProductPurchase product={product} />
            </div>

            {facts.length > 0 && (
              <ul className="text-muted mt-7 flex flex-wrap gap-x-5 gap-y-1 text-xs tracking-widest uppercase">
                {facts.map((fact) => (
                  <li key={String(fact)}>{fact}</li>
                ))}
              </ul>
            )}

            <div className="border-line divide-line mt-8 divide-y border-y">
              {product.description && (
                <details className="group py-5" open>
                  <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium tracking-[0.2em] uppercase [&::-webkit-details-marker]:hidden">
                    The fragrance
                    <ChevronDown className="size-4 transition group-open:rotate-180" strokeWidth={1.5} />
                  </summary>
                  <Markdown source={product.description} className="pt-4 text-[0.95rem]" />
                </details>
              )}
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium tracking-[0.2em] uppercase [&::-webkit-details-marker]:hidden">
                  Shipping & returns
                  <ChevronDown className="size-4 transition group-open:rotate-180" strokeWidth={1.5} />
                </summary>
                <div className="text-muted space-y-2 pt-4 text-[0.95rem] leading-relaxed">
                  {checkout.checkoutNote && <p>{checkout.checkoutNote}</p>}
                  <p>
                    See our{" "}
                    <Link href="/shipping-returns" className="text-ink link-underline">
                      shipping & returns policy
                    </Link>{" "}
                    for details.
                  </p>
                </div>
              </details>
            </div>

            {builder.enabled && (
              <p className="text-muted mt-6 text-sm">
                Want something closer to you?{" "}
                <Link href="/create" className="text-ink link-underline">
                  Compose your own perfume
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      </div>

      {hasNotes && (
        <section className="tone-surface bg-bg text-ink mt-8 py-16 md:py-20">
          <div className="container-page">
            <h2 className="heading mb-10 text-center text-4xl md:text-5xl">The notes</h2>
            <div className="mx-auto grid max-w-4xl gap-10 text-center md:grid-cols-3">
              <Notes title="Top" notes={product.topNotes} />
              <Notes title="Heart" notes={product.heartNotes} />
              <Notes title="Base" notes={product.baseNotes} />
            </div>
          </div>
        </section>
      )}

      <section id="reviews" className="container-page scroll-mt-28 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="heading text-4xl md:text-5xl">Reviews</h2>
              {rating !== null && (
                <p className="text-muted mt-2 flex items-center gap-2 text-sm">
                  <Stars rating={rating} /> {rating.toFixed(1)} out of 5 · {reviewCount} review
                  {reviewCount === 1 ? "" : "s"}
                </p>
              )}
            </div>
          </div>
          {reviewCount === 0 && <p className="text-muted mb-8">No reviews yet — be the first to share yours.</p>}
          <ul className="divide-line mb-8 divide-y">
            {product.reviews.map((review) => (
              <li key={review.id} className="py-6">
                <div className="flex items-center justify-between gap-4">
                  <Stars rating={review.rating} />
                  <time className="text-muted text-xs" dateTime={review.createdAt}>
                    {formatDate(review.createdAt, store.locale)}
                  </time>
                </div>
                {review.title && <p className="mt-3 font-medium">{review.title}</p>}
                <p className="text-muted mt-2 leading-relaxed">{review.body}</p>
                <p className="mt-3 text-xs tracking-widest uppercase">{review.name}</p>
              </li>
            ))}
          </ul>
          <ReviewForm productId={product.id} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-line border-t py-16 md:py-20">
          <div className="container-page">
            <h2 className="heading mb-10 text-center text-4xl md:text-5xl">You may also like</h2>
            <ProductGrid products={related} money={store} />
          </div>
        </section>
      )}
    </>
  );
}
