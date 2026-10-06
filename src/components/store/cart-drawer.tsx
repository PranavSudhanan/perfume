"use client";

import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { cart, cartSubtotal, useCart, type CartItem } from "@/lib/cart";
import { Bottle } from "./bottle";
import { useMoney } from "./store-context";

export function CartThumb({ item, className }: { item: CartItem; className?: string }) {
  return (
    <div className={`bg-surface rounded-theme shrink-0 overflow-hidden ${className ?? "h-24 w-20"}`}>
      {item.kind === "custom" ? (
        <Bottle color={item.liquidColor} label={item.labelText} className="h-full w-full p-1.5" />
      ) : item.image ? (
        <img src={item.image} alt="" className="h-full w-full object-cover" />
      ) : null}
    </div>
  );
}

export function QtyStepper({
  qty,
  onChange,
  max = 10,
}: {
  qty: number;
  onChange: (qty: number) => void;
  max?: number;
}) {
  return (
    <div className="border-line rounded-btn inline-flex items-center border">
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        className="p-2 transition hover:opacity-60"
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-7 text-center text-sm tabular-nums" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, qty + 1))}
        disabled={qty >= max}
        className="p-2 transition hover:opacity-60 disabled:opacity-30"
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

export function CartDrawer() {
  const { items, open } = useCart();
  const money = useMoney();
  const pathname = usePathname();

  useEffect(() => {
    cart.close();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cart.close();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className={open ? "" : "pointer-events-none"} aria-hidden={!open}>
      <div
        onClick={() => cart.close()}
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-label="Shopping bag"
        aria-modal="true"
        inert={!open}
        className={`bg-bg text-ink fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="border-line flex items-center justify-between border-b px-6 py-5">
          <h2 className="heading text-2xl">Your bag</h2>
          <button type="button" onClick={() => cart.close()} className="-mr-2 p-2" aria-label="Close bag">
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="text-muted size-10" strokeWidth={1} />
            <p className="text-muted">Your bag is empty.</p>
            <Link href="/shop" className="btn btn-primary">
              Explore perfumes
            </Link>
          </div>
        ) : (
          <>
            <ul className="divide-line flex-1 divide-y overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 py-5">
                  <CartThumb item={item} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <p className="font-medium">
                        {item.slug ? <Link href={`/product/${item.slug}`}>{item.name}</Link> : item.name}
                      </p>
                      <p className="shrink-0 text-sm tabular-nums">{money(item.unitPrice * item.qty)}</p>
                    </div>
                    {item.variantLabel && <p className="text-muted text-sm">{item.variantLabel}</p>}
                    {item.kind === "custom" && (
                      <p className="text-muted mt-0.5 line-clamp-2 text-xs">
                        {item.summary
                          .filter((s) => s.options.length)
                          .map((s) => s.options.join(", "))
                          .join(" · ")}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <QtyStepper qty={item.qty} onChange={(q) => cart.setQty(item.key, q)} />
                      <button
                        type="button"
                        onClick={() => cart.remove(item.key)}
                        className="text-muted link-underline text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-line space-y-4 border-t px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="text-sm tracking-widest uppercase">Subtotal</span>
                <span className="text-lg tabular-nums">{money(cartSubtotal(items))}</span>
              </div>
              <p className="text-muted text-xs">Shipping and discounts are calculated at checkout.</p>
              <Link href="/checkout" className="btn btn-primary w-full">
                Checkout
              </Link>
              <Link href="/cart" className="btn btn-outline w-full">
                View bag
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
