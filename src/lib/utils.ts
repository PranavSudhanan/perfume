export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export type MoneyFormat = { currencyCode: string; locale: string };

/** Formats an amount held in minor units (paise, cents). */
export function formatMoney(minor: number, { currencyCode, locale }: MoneyFormat) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: minor % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(minor / 100);
  } catch {
    return `${currencyCode} ${(minor / 100).toFixed(2)}`;
  }
}

export function formatDate(value: Date | string, locale = "en-IN") {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function formatDateTime(value: Date | string, locale = "en-IN") {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Fills gaps in `value` from `defaults`. Objects merge recursively; arrays and scalars are replaced. */
export function withDefaults<T>(defaults: T, value: unknown): T {
  if (!isPlainObject(defaults) || !isPlainObject(value)) {
    return (value === undefined || value === null ? defaults : value) as T;
  }
  const out: Record<string, unknown> = { ...defaults };
  for (const [key, v] of Object.entries(value)) {
    out[key] = key in defaults ? withDefaults((defaults as Record<string, unknown>)[key], v) : v;
  }
  return out as T;
}

/** Only same-site paths and http(s)/mailto/tel links are allowed in admin-entered hrefs. */
export function safeHref(href: unknown, fallback = "#") {
  if (typeof href !== "string") return fallback;
  const value = href.trim();
  if (!value) return fallback;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (value.startsWith("#")) return value;
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  return fallback;
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** True when `date` is already behind us. */
export function isPast(date: Date | string) {
  return new Date(date).getTime() < Date.now();
}
