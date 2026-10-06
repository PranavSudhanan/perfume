"use client";

import { Check, Star } from "lucide-react";
import { useState, useTransition } from "react";
import { submitReviewAction } from "@/lib/actions/shop";
import { cart } from "@/lib/cart";
import type { ProductDetail } from "@/lib/data";
import { QtyStepper } from "./cart-drawer";
import { useMoney } from "./store-context";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  if (!images.length) return <div className="card-media bg-surface rounded-theme" />;
  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row md:gap-4">
      {images.length > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto md:w-20 md:flex-col md:overflow-visible">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={`bg-surface rounded-theme aspect-[4/5] w-16 shrink-0 overflow-hidden border transition md:w-full ${i === active ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="card-media bg-surface rounded-theme relative flex-1 overflow-hidden">
        <img
          src={images[active] ?? images[0]}
          alt={name}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}

export function ProductPurchase({ product }: { product: ProductDetail }) {
  const money = useMoney();
  const firstAvailable = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = product.variants.find((v) => v.id === variantId) ?? firstAvailable;
  if (!variant) return <p className="text-muted">This perfume is not available at the moment.</p>;
  const soldOut = variant.stock <= 0;
  const maxQty = Math.max(1, Math.min(10, variant.stock));

  return (
    <div>
      <p className="flex items-baseline gap-3 text-2xl tabular-nums">
        {money(variant.price)}
        {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
          <s className="text-muted text-lg">{money(variant.compareAtPrice)}</s>
        )}
      </p>

      {product.variants.length > 1 && (
        <fieldset className="mt-7">
          <legend className="field-label">Size</legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setVariantId(v.id);
                  setQty(1);
                }}
                aria-pressed={v.id === variant.id}
                className={`rounded-btn border px-5 py-2.5 text-sm transition ${v.id === variant.id ? "border-ink bg-ink text-bg" : "border-line hover:border-ink"} ${v.stock <= 0 ? "line-through opacity-50" : ""}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-7 flex flex-wrap items-stretch gap-3">
        <QtyStepper qty={Math.min(qty, maxQty)} onChange={(q) => setQty(Math.max(1, q))} max={maxQty} />
        <button
          type="button"
          disabled={soldOut}
          onClick={() => {
            cart.add({
              key: `v:${variant.id}`,
              kind: "product",
              variantId: variant.id,
              qty: Math.min(qty, maxQty),
              name: product.name,
              variantLabel: variant.label,
              image: product.images[0] ?? null,
              slug: product.slug,
              unitPrice: variant.price,
            });
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
          }}
          className="btn btn-primary min-w-48 flex-1"
        >
          {soldOut ? (
            "Sold out"
          ) : added ? (
            <>
              <Check className="size-4" /> Added
            </>
          ) : (
            "Add to bag"
          )}
        </button>
      </div>
      {!soldOut && variant.stock <= 5 && (
        <p className="text-accent mt-3 text-sm">Only {variant.stock} left in this size.</p>
      )}
    </div>
  );
}

export function ReviewForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  if (status?.ok) return <p className="border-line rounded-theme border p-5 text-sm">{status.text}</p>;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-outline">
        Write a review
      </button>
    );
  }

  return (
    <form
      className="border-line rounded-theme relative space-y-4 border p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const form = Object.fromEntries(new FormData(e.currentTarget));
        start(async () => {
          const res = await submitReviewAction({ ...form, productId, rating });
          setStatus(
            res.ok
              ? { ok: true, text: "Thank you! Your review will appear once it has been approved." }
              : { ok: false, text: res.error },
          );
        });
      }}
    >
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <div>
        <span className="field-label">Your rating</span>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onClick={() => setRating(n)}
            >
              <Star
                className={`size-6 ${n <= rating ? "fill-accent text-accent" : "text-line"}`}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Name</span>
          <input name="name" required maxLength={60} className="field" />
        </label>
        <label className="block">
          <span className="field-label">Headline</span>
          <input name="title" maxLength={100} className="field" />
        </label>
      </div>
      <label className="block">
        <span className="field-label">Review</span>
        <textarea name="body" required rows={4} maxLength={1500} className="field resize-y" />
      </label>
      {status && !status.ok && <p className="text-sm text-red-500">{status.text}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Sending…" : "Submit review"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-outline">
          Cancel
        </button>
      </div>
    </form>
  );
}
