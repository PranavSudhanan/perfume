"use client";

import { Tag, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cart, cartSubtotal, useCart } from "@/lib/cart";
import type { Quote } from "@/lib/pricing";
import { CartThumb, QtyStepper } from "./cart-drawer";
import { useMoney } from "./store-context";
import { useQuote } from "./use-quote";

const COUPON_KEY = "bag:coupon";

export function readCoupon() {
  try {
    return window.sessionStorage.getItem(COUPON_KEY) ?? "";
  } catch {
    return "";
  }
}

/** A code applies to one order; forget it once that order is placed. */
export function clearCoupon() {
  writeCoupon("");
}

function writeCoupon(code: string) {
  try {
    if (code) window.sessionStorage.setItem(COUPON_KEY, code);
    else window.sessionStorage.removeItem(COUPON_KEY);
  } catch {
    // Session storage unavailable; the code simply won't carry over to checkout.
  }
}

/** Discount-code entry shared by the bag and checkout. */
export function CouponField({
  applied,
  error,
  onApply,
}: {
  applied: string | null;
  error: string | null;
  onApply: (code: string) => void;
}) {
  const [draft, setDraft] = useState("");
  if (applied) {
    return (
      <div className="border-line rounded-theme flex items-center justify-between border px-4 py-3 text-sm">
        <span className="flex items-center gap-2">
          <Tag className="text-accent size-4" strokeWidth={1.5} />
          <span className="font-medium tracking-wider">{applied}</span> applied
        </span>
        <button
          type="button"
          onClick={() => {
            writeCoupon("");
            onApply("");
          }}
          aria-label="Remove discount code"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }
  const apply = () => {
    const code = draft.trim().toUpperCase();
    if (!code) return;
    writeCoupon(code);
    onApply(code);
  };
  return (
    <div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          placeholder="Discount code"
          aria-label="Discount code"
          className="field flex-1 uppercase placeholder:normal-case"
        />
        <button type="button" onClick={apply} className="btn btn-outline">
          Apply
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}

export function Totals({ quote, loading, fallbackSubtotal }: { quote: Quote | null; loading: boolean; fallbackSubtotal: number }) {
  const money = useMoney();
  const row = "flex items-center justify-between";
  return (
    <dl className={`space-y-2.5 text-sm transition-opacity ${loading ? "opacity-50" : ""}`}>
      <div className={row}>
        <dt className="text-muted">Subtotal</dt>
        <dd className="tabular-nums">{money(quote?.subtotal ?? fallbackSubtotal)}</dd>
      </div>
      {quote && quote.discount > 0 && (
        <div className={row}>
          <dt className="text-muted">Discount ({quote.couponCode})</dt>
          <dd className="tabular-nums">−{money(quote.discount)}</dd>
        </div>
      )}
      <div className={row}>
        <dt className="text-muted">Shipping</dt>
        <dd className="tabular-nums">{quote ? (quote.shipping ? money(quote.shipping) : "Free") : "—"}</dd>
      </div>
      {quote && quote.tax > 0 && (
        <div className={row}>
          <dt className="text-muted">Tax</dt>
          <dd className="tabular-nums">{money(quote.tax)}</dd>
        </div>
      )}
      <div className={`${row} border-line border-t pt-4 text-base`}>
        <dt className="tracking-widest uppercase">Total</dt>
        <dd className="text-xl tabular-nums">{quote ? money(quote.total) : "—"}</dd>
      </div>
    </dl>
  );
}

export function CartView() {
  const { items, ready } = useCart();
  const money = useMoney();
  const [coupon, setCoupon] = useState(readCoupon);
  const { quote, loading } = useQuote(items, coupon);

  if (!ready) return <div className="min-h-[40vh]" aria-busy="true" />;
  if (!items.length) {
    return (
      <div className="py-20 text-center">
        <p className="heading text-3xl">Your bag is empty</p>
        <p className="text-muted mt-3">Discover the collection or compose a perfume of your own.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn btn-primary">
            Shop perfumes
          </Link>
          <Link href="/create" className="btn btn-outline">
            Create your own
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
      <ul className="border-line divide-line divide-y border-y">
        {items.map((item, index) => {
          const problem = quote?.lines[index]?.error;
          return (
            <li key={item.key} className="flex gap-5 py-6">
              <CartThumb item={item} className="h-32 w-24 md:h-40 md:w-32" />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="heading text-2xl">
                      {item.slug ? <Link href={`/product/${item.slug}`}>{item.name}</Link> : item.name}
                    </p>
                    {item.variantLabel && <p className="text-muted mt-1 text-sm">{item.variantLabel}</p>}
                  </div>
                  <p className="shrink-0 tabular-nums">{money(item.unitPrice * item.qty)}</p>
                </div>
                {item.kind === "custom" && (
                  <dl className="text-muted mt-2 space-y-0.5 text-sm">
                    {item.summary
                      .filter((s) => s.options.length)
                      .map((s) => (
                        <div key={s.title} className="flex gap-2">
                          <dt className="shrink-0">{s.title}:</dt>
                          <dd className="text-ink">{s.options.join(", ")}</dd>
                        </div>
                      ))}
                    {item.giftMessage && (
                      <div className="flex gap-2">
                        <dt className="shrink-0">Gift note:</dt>
                        <dd className="text-ink italic">“{item.giftMessage}”</dd>
                      </div>
                    )}
                  </dl>
                )}
                {problem && <p className="mt-2 text-sm text-red-500">{problem}</p>}
                <div className="mt-auto flex items-center justify-between pt-4">
                  <QtyStepper qty={item.qty} onChange={(q) => cart.setQty(item.key, q)} />
                  <button
                    type="button"
                    onClick={() => cart.remove(item.key)}
                    className="text-muted link-underline text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="tone-surface bg-bg rounded-theme h-fit space-y-6 p-6 md:p-8 lg:sticky lg:top-28">
        <h2 className="heading text-3xl">Summary</h2>
        <CouponField applied={quote?.couponCode ?? null} error={quote?.couponError ?? null} onApply={setCoupon} />
        <Totals quote={quote} loading={loading} fallbackSubtotal={cartSubtotal(items)} />
        <Link
          href="/checkout"
          aria-disabled={quote ? !quote.valid : undefined}
          className={`btn btn-primary w-full ${quote && !quote.valid ? "pointer-events-none opacity-50" : ""}`}
        >
          Proceed to checkout
        </Link>
        {quote && !quote.valid && (
          <p className="text-center text-sm text-red-500">Please resolve the items marked above.</p>
        )}
        <Link href="/shop" className="link-underline block text-center text-sm">
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
