"use client";

import { useEffect, useMemo, useState } from "react";
import { quoteCartAction } from "@/lib/actions/shop";
import { toLines, type CartItem } from "@/lib/cart";
import type { Quote } from "@/lib/pricing";

/**
 * Asks the server to price the bag. The result is authoritative: it reflects
 * current prices, stock, shipping rules and any discount code.
 */
export function useQuote(items: CartItem[], couponCode: string) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  // Re-quote only when what is being bought changes, not on every render.
  const signature = useMemo(() => JSON.stringify([toLines(items), couponCode]), [items, couponCode]);

  useEffect(() => {
    let cancelled = false;
    const [lines, code] = JSON.parse(signature) as [ReturnType<typeof toLines>, string];
    const timer = setTimeout(() => {
      setLoading(true);
      quoteCartAction(lines, code)
        .then((result) => {
          if (!cancelled) setQuote(result);
        })
        .catch(() => {
          if (!cancelled) setQuote(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [signature]);

  return { quote, loading };
}
