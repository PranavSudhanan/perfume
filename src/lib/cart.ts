"use client";

import { useSyncExternalStore } from "react";
import type { CartLineInput } from "./pricing";

/**
 * The bag lives in localStorage. Names and prices stored here are only for
 * display — the server re-prices every line from the database at checkout.
 */
export type CartItem = {
  key: string;
  qty: number;
  name: string;
  variantLabel: string | null;
  image: string | null;
  slug: string | null;
  unitPrice: number;
} & (
  | { kind: "product"; variantId: string }
  | {
      kind: "custom";
      selections: Record<string, string[]>;
      summary: { title: string; options: string[] }[];
      labelText?: string;
      giftMessage?: string;
      liquidColor: string;
    }
);

/** `ready` turns true once the bag has been read from localStorage in the browser. */
type State = { items: CartItem[]; open: boolean; ready: boolean };

const STORAGE_KEY = "bag:v1";
const MAX_QTY = 10;
const EMPTY: State = { items: [], open: false, ready: false };

let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function set(next: State, persist = true) {
  state = next;
  if (persist) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.items));
    } catch {
      // Storage can be unavailable (private mode); the bag still works for this visit.
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  if (!loaded) {
    loaded = true;
    state = { ...state, items: read(), ready: true };
    // Keep several open tabs in sync.
    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY) set({ ...state, items: read() }, false);
    });
    queueMicrotask(() => listeners.forEach((l) => l()));
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCart() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  );
}

export const cart = {
  add(item: CartItem, openDrawer = true) {
    const existing = state.items.find((i) => i.key === item.key);
    const items = existing
      ? state.items.map((i) =>
          i.key === item.key ? { ...i, qty: Math.min(MAX_QTY, i.qty + item.qty) } : i,
        )
      : [...state.items, { ...item, qty: Math.min(MAX_QTY, item.qty) }];
    set({ ...state, items, open: openDrawer || state.open });
  },
  setQty(key: string, qty: number) {
    if (qty <= 0) return cart.remove(key);
    set({
      ...state,
      items: state.items.map((i) => (i.key === key ? { ...i, qty: Math.min(MAX_QTY, qty) } : i)),
    });
  },
  remove(key: string) {
    set({ ...state, items: state.items.filter((i) => i.key !== key) });
  },
  clear() {
    set({ ...state, items: [], open: false });
  },
  open() {
    set({ ...state, open: true }, false);
  },
  close() {
    set({ ...state, open: false }, false);
  },
};

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.qty, 0);
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
}

export function toLines(items: CartItem[]): CartLineInput[] {
  return items.map((i) =>
    i.kind === "product"
      ? { kind: "product", variantId: i.variantId, qty: i.qty }
      : {
          kind: "custom",
          selections: i.selections,
          labelText: i.labelText,
          giftMessage: i.giftMessage,
          qty: i.qty,
        },
  );
}
