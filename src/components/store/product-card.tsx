import { Star } from "lucide-react";
import Link from "next/link";
import type { ProductCardData } from "@/lib/data";
import { formatMoney, type MoneyFormat } from "@/lib/utils";

export function Stars({ rating, className = "size-3.5" }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${className} ${n <= Math.round(rating) ? "fill-accent text-accent" : "text-line fill-transparent"}`}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

export function ProductCard({ product, money }: { product: ProductCardData; money: MoneyFormat }) {
  return (
    <Link href={`/product/${product.slug}`} className="product-card group block">
      <div className="card-media bg-surface rounded-theme relative overflow-hidden">
        {product.image && (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${product.hoverImage ? "group-hover:opacity-0" : "group-hover:scale-105"}`}
          />
        )}
        {product.hoverImage && (
          <img
            src={product.hoverImage}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:opacity-100"
          />
        )}
        {(product.badge || !product.inStock) && (
          <span className="bg-bg text-ink absolute top-3 left-3 px-2.5 py-1 text-[0.65rem] font-medium tracking-[0.16em] uppercase">
            {product.inStock ? product.badge : "Sold out"}
          </span>
        )}
      </div>
      <div className="pt-4">
        {product.scentFamily && (
          <p className="text-muted text-[0.68rem] tracking-[0.2em] uppercase">{product.scentFamily}</p>
        )}
        <h3 className="heading mt-1 text-xl md:text-2xl">{product.name}</h3>
        {product.tagline && <p className="text-muted mt-1 line-clamp-1 text-sm">{product.tagline}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-sm tabular-nums">
            From {formatMoney(product.priceFrom, money)}
            {product.compareAt && (
              <s className="text-muted ml-2">{formatMoney(product.compareAt, money)}</s>
            )}
          </p>
          {product.rating !== null && (
            <span className="text-muted flex items-center gap-1 text-xs">
              <Stars rating={product.rating} className="size-3" />({product.reviewCount})
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({
  products,
  money,
  columns = 4,
}: {
  products: ProductCardData[];
  money: MoneyFormat;
  columns?: 3 | 4;
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 ${columns === 3 ? "lg:grid-cols-3" : "md:grid-cols-3 lg:grid-cols-4"}`}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} money={money} />
      ))}
    </div>
  );
}
