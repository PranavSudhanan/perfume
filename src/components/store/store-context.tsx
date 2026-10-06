"use client";

import { createContext, useCallback, useContext } from "react";
import { formatMoney } from "@/lib/utils";

export type StoreInfo = { name: string; currencyCode: string; locale: string };

const StoreContext = createContext<StoreInfo>({ name: "", currencyCode: "INR", locale: "en-IN" });

export function StoreProvider({ value, children }: { value: StoreInfo; children: React.ReactNode }) {
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}

/** Returns a formatter for amounts in minor units, using the store's currency. */
export function useMoney() {
  const store = useContext(StoreContext);
  return useCallback((minor: number) => formatMoney(minor, store), [store]);
}
