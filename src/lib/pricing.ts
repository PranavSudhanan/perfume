import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { builderOptions, coupons, productVariants, type Coupon, type CustomPerfume } from "@/db/schema";
import { blendColors } from "./color";
import type { BuilderSettings, CheckoutSettings } from "./config";
import { getSettings } from "./data";

/** What the browser sends for a cart line. Prices are never accepted from the client. */
export type CartLineInput =
  | { kind: "product"; variantId: string; qty: number }
  | {
      kind: "custom";
      selections: Record<string, string[]>;
      labelText?: string;
      giftMessage?: string;
      qty: number;
    };

export type QuoteLine = {
  kind: "product" | "custom";
  name: string;
  variantLabel: string | null;
  image: string | null;
  slug: string | null;
  productId: string | null;
  variantId: string | null;
  custom: CustomPerfume | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  /** Set when this line can't be ordered as requested. */
  error: string | null;
};

export type Quote = {
  lines: QuoteLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode: string | null;
  couponError: string | null;
  valid: boolean;
};

export const MAX_QTY = 10;
export const MAX_LINES = 30;

type OptionRow = typeof builderOptions.$inferSelect;

export function priceCustomPerfume(
  builder: BuilderSettings,
  options: OptionRow[],
  input: { selections: Record<string, string[]>; labelText?: string; giftMessage?: string },
): { unitPrice: number; custom: CustomPerfume; error: string | null } {
  const byId = new Map(options.map((o) => [o.id, o]));
  let unitPrice = builder.basePrice;
  let error: string | null = builder.enabled ? null : "Custom perfumes are not available right now.";
  const selections: CustomPerfume["selections"] = [];
  const tints: (string | null)[] = [];

  for (const step of builder.steps) {
    const ids = [...new Set(input.selections[step.key] ?? [])];
    const chosen = ids.map((id) => byId.get(id)).filter((o): o is OptionRow => !!o);
    if (chosen.length !== ids.length || chosen.some((o) => o.step !== step.key || !o.active)) {
      error ??= `One of the options chosen for “${step.title}” is no longer available.`;
    }
    if (chosen.length < step.min || chosen.length > step.max) {
      error ??=
        step.min === step.max
          ? `Choose ${step.min} option${step.min === 1 ? "" : "s"} for “${step.title}”.`
          : `Choose between ${step.min} and ${step.max} options for “${step.title}”.`;
    }
    for (const option of chosen) {
      unitPrice += option.priceDelta;
      tints.push(option.color);
    }
    if (chosen.length) {
      selections.push({ step: step.key, title: step.title, options: chosen.map((o) => o.name) });
    }
  }

  const labelText = builder.labelEnabled ? (input.labelText ?? "").trim() : "";
  if (labelText.length > builder.labelMaxChars) {
    error ??= `The label can be at most ${builder.labelMaxChars} characters.`;
  }
  if (labelText) unitPrice += builder.labelPrice;
  const giftMessage = builder.giftMessageEnabled ? (input.giftMessage ?? "").trim() : "";
  if (giftMessage.length > 300) error ??= "The gift message can be at most 300 characters.";

  return {
    unitPrice,
    error,
    custom: {
      selections,
      labelText: labelText || undefined,
      giftMessage: giftMessage || undefined,
      liquidColor: blendColors(tints),
    },
  };
}

export function couponProblem(coupon: Coupon | undefined, subtotal: number): string | null {
  if (!coupon || !coupon.active) return "This code is not valid.";
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) return "This code has expired.";
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return "This code has reached its usage limit.";
  }
  if (subtotal < coupon.minSubtotal) return "Your order doesn't meet the minimum for this code.";
  return null;
}

export function couponDiscount(coupon: Coupon, subtotal: number) {
  const raw =
    coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  return Math.max(0, Math.min(raw, subtotal));
}

export function totals(checkout: CheckoutSettings, subtotal: number, discount: number) {
  const net = subtotal - discount;
  const freeShipping = checkout.freeShippingAbove > 0 && net >= checkout.freeShippingAbove;
  const shipping = subtotal === 0 || freeShipping ? 0 : checkout.shippingFlat;
  const tax = Math.round((net * checkout.taxPercent) / 100);
  return { shipping, tax, total: net + shipping + tax };
}

/** Prices a cart from live database values. Used by the cart, checkout and order placement. */
export async function buildQuote(inputs: CartLineInput[], couponCode?: string | null): Promise<Quote> {
  const { checkout, builder } = await getSettings();
  const variantIds = inputs.flatMap((l) => (l.kind === "product" ? [l.variantId] : []));
  const hasCustom = inputs.some((l) => l.kind === "custom");

  const [variants, options] = await Promise.all([
    variantIds.length
      ? db.query.productVariants.findMany({
          where: inArray(productVariants.id, variantIds),
          with: { product: true },
        })
      : [],
    hasCustom ? db.select().from(builderOptions) : [],
  ]);
  const variantById = new Map(variants.map((v) => [v.id, v]));
  const requested = new Map<string, number>();

  const lines: QuoteLine[] = inputs.map((input) => {
    const qty = Math.max(1, Math.min(MAX_QTY, Math.floor(input.qty) || 1));
    if (input.kind === "custom") {
      const priced = priceCustomPerfume(builder, options, input);
      return {
        kind: "custom",
        name: priced.custom.labelText
          ? `${builder.productName} — “${priced.custom.labelText}”`
          : builder.productName,
        variantLabel: priced.custom.selections.find((s) => s.step === "size")?.options[0] ?? null,
        image: null,
        slug: null,
        productId: null,
        variantId: null,
        custom: priced.custom,
        unitPrice: priced.unitPrice,
        qty,
        lineTotal: priced.unitPrice * qty,
        error: priced.error,
      };
    }
    const variant = variantById.get(input.variantId);
    if (!variant || !variant.product.active) {
      return {
        kind: "product",
        name: variant?.product.name ?? "Unavailable product",
        variantLabel: variant?.label ?? null,
        image: variant?.product.images[0] ?? null,
        slug: null,
        productId: null,
        variantId: null,
        custom: null,
        unitPrice: 0,
        qty,
        lineTotal: 0,
        error: "This product is no longer available.",
      };
    }
    const totalRequested = (requested.get(variant.id) ?? 0) + qty;
    requested.set(variant.id, totalRequested);
    const error =
      variant.stock <= 0
        ? "Out of stock."
        : totalRequested > variant.stock
          ? `Only ${variant.stock} left in stock.`
          : null;
    return {
      kind: "product",
      name: variant.product.name,
      variantLabel: variant.label,
      image: variant.product.images[0] ?? null,
      slug: variant.product.slug,
      productId: variant.productId,
      variantId: variant.id,
      custom: null,
      unitPrice: variant.price,
      qty,
      lineTotal: variant.price * qty,
      error,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + (l.error ? 0 : l.lineTotal), 0);

  let discount = 0;
  let appliedCode: string | null = null;
  let couponError: string | null = null;
  const code = couponCode?.trim().toUpperCase();
  if (code) {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
    couponError = couponProblem(coupon, subtotal);
    if (!couponError && coupon) {
      discount = couponDiscount(coupon, subtotal);
      appliedCode = coupon.code;
    }
  }

  return {
    lines,
    subtotal,
    discount,
    ...totals(checkout, subtotal, discount),
    couponCode: appliedCode,
    couponError,
    valid: lines.length > 0 && lines.every((l) => !l.error),
  };
}
