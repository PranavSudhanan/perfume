"use server";

import { and, desc, eq, inArray, ne, notInArray, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import {
  builderOptions,
  categories,
  coupons,
  media,
  messages,
  orderItems,
  orders,
  pages,
  products,
  productVariants,
  reviews,
  settings,
  subscribers,
  users,
} from "@/db/schema";
import { requireAdmin, UnauthorizedError } from "@/lib/auth";
import { SETTINGS_KEYS, type SettingsKey } from "@/lib/config";
import { TAGS } from "@/lib/data";
import type { ActionResult } from "@/lib/result";
import { SECTION_MAP } from "@/lib/sections";
import { FONT_NAMES } from "@/lib/theme";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/utils";

/** An error whose message is safe and useful to show to the admin. */
class UserError extends Error {}

function describe(error: unknown) {
  if (error instanceof UnauthorizedError || error instanceof UserError) return error.message;
  if (error instanceof z.ZodError) {
    const issue = error.issues[0];
    if (!issue) return "Invalid input.";
    // Our own messages already say what is wrong; zod's built-in ones need the field name.
    const builtIn = /^(Invalid|Too (big|small)|Unrecognized)/.test(issue.message);
    const where = issue.path.filter((p) => typeof p === "string").join(" › ");
    return builtIn && where ? `${where}: ${issue.message}` : issue.message;
  }
  const code =
    (error as { code?: string })?.code ?? (error as { cause?: { code?: string } })?.cause?.code;
  if (code === "23505") return "That URL, code or name is already in use — choose a different one.";
  console.error("Admin action failed", error);
  return "Something went wrong. Please try again.";
}

/** Runs an admin mutation: checks the session first and turns failures into a result. */
async function guard<T extends object>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    await requireAdmin();
    return { ok: true, ...(await fn()) };
  } catch (error) {
    return { ok: false, error: describe(error) };
  }
}

const text = (max = 200) => z.string().trim().max(max);
const optional = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter a URL slug.")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only.");
const money = z.number().int().min(0).max(1_000_000_000);
const image = z
  .string()
  .trim()
  .max(600)
  .refine((v) => v === "" || /^(\/(?!\/)|https?:\/\/)/.test(v), "Images must be uploaded or start with https://");
const optionalImage = image.nullish().transform((v) => v || null);
const tags = z.array(text(60).min(1)).max(20);
const hex = z.string().regex(/^#[0-9a-f]{6}$/i, "Use a 6-digit hex colour like #a07a35.");
const link = z.object({ label: text(60), href: text(300) });
const uuidOrNull = z.preprocess((v) => (v === "" ? null : v), z.uuid().nullish());

/* ---------------------------------- settings ---------------------------------- */

const settingsSchemas: Record<SettingsKey, z.ZodType> = {
  store: z.object({
    name: text(80).min(1, "Enter a store name."),
    tagline: text(120),
    logo: image,
    email: text(200),
    phone: text(40),
    address: text(300),
    currencyCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code such as INR or USD."),
    locale: z
      .string()
      .trim()
      .refine((v) => {
        try {
          return Intl.NumberFormat.supportedLocalesOf(v).length > 0;
        } catch {
          return false;
        }
      }, "Use a locale such as en-IN or en-US."),
    instagram: text(300),
    facebook: text(300),
    youtube: text(300),
    whatsapp: text(40),
    seoTitle: text(200),
    seoDescription: text(400),
    socialImage: image,
  }),
  theme: z.object({
    preset: text(40),
    colors: z.object({
      background: hex,
      surface: hex,
      text: hex,
      muted: hex,
      primary: hex,
      primaryText: hex,
      accent: hex,
      border: hex,
    }),
    headingFont: z.enum(FONT_NAMES as [string, ...string[]]),
    bodyFont: z.enum(FONT_NAMES as [string, ...string[]]),
    headingCase: z.enum(["normal", "uppercase"]),
    radius: z.enum(["none", "soft", "round", "pill"]),
    buttonStyle: z.enum(["solid", "outline"]),
    containerWidth: z.enum(["narrow", "normal", "wide"]),
    headerLayout: z.enum(["left", "center"]),
    headerSticky: z.boolean(),
    cardStyle: z.enum(["plain", "boxed"]),
    imageRatio: z.enum(["square", "portrait", "tall"]),
  }),
  navigation: z.object({
    announcementEnabled: z.boolean(),
    announcements: z.array(text(160).min(1)).max(8),
    announcementHref: text(300),
    header: z.array(link).max(12),
    footerAbout: text(500),
    footerColumns: z.array(z.object({ title: text(60), links: z.array(link).max(12) })).max(5),
    footerNewsletter: z.boolean(),
    copyright: text(200),
  }),
  checkout: z.object({
    shippingFlat: money,
    freeShippingAbove: money,
    taxPercent: z.number().min(0).max(50),
    codEnabled: z.boolean(),
    onlineEnabled: z.boolean(),
    orderPrefix: text(6),
    country: text(60),
    checkoutNote: text(400),
  }),
  builder: z
    .object({
      enabled: z.boolean(),
      productName: text(80).min(1, "Enter a name for the custom perfume."),
      title: text(150),
      subtitle: text(400),
      basePrice: money,
      leadTime: text(200),
      steps: z
        .array(
          z
            .object({
              key: z
                .string()
                .trim()
                .toLowerCase()
                .regex(/^[a-z0-9-]{1,40}$/, "Step keys use lowercase letters, numbers and dashes."),
              title: text(80).min(1, "Every step needs a title."),
              subtitle: text(200),
              min: z.number().int().min(0).max(10),
              max: z.number().int().min(1).max(10),
            })
            .refine((s) => s.min <= s.max, "Minimum choices can't exceed the maximum."),
        )
        .min(1, "Add at least one step.")
        .max(12),
      labelEnabled: z.boolean(),
      labelMaxChars: z.number().int().min(1).max(40),
      labelPrice: money,
      giftMessageEnabled: z.boolean(),
    })
    .refine(
      (b) => new Set(b.steps.map((s) => s.key)).size === b.steps.length,
      "Each step needs a unique key.",
    ),
};

export async function saveSettingsAction(key: SettingsKey, value: unknown) {
  return guard(async () => {
    if (!SETTINGS_KEYS.includes(key)) throw new UserError("Unknown settings group.");
    const parsed = settingsSchemas[key].parse(value) as Record<string, unknown>;
    await db
      .insert(settings)
      .values({ key, value: parsed })
      .onConflictDoUpdate({ target: settings.key, set: { value: parsed, updatedAt: new Date() } });
    updateTag(TAGS.settings);
    return {};
  });
}

/* ------------------------------------ pages ------------------------------------ */

/** Slugs that belong to built-in storefront routes. */
const RESERVED_SLUGS = new Set([
  "shop",
  "product",
  "create",
  "cart",
  "checkout",
  "order",
  "track",
  "account",
  "admin",
  "api",
  "art",
]);

const pageSchema = z.object({
  id: z.uuid().optional(),
  slug,
  title: text(150).min(1, "Enter a page title."),
  sections: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        type: z.string().refine((t) => t in SECTION_MAP, "Unknown section type."),
        enabled: z.boolean(),
        props: z.record(z.string(), z.unknown()),
      }),
    )
    .max(60),
  published: z.boolean(),
  seoTitle: optional(200),
  seoDescription: optional(400),
});

export async function savePageAction(input: unknown) {
  return guard(async () => {
    const { id, ...page } = pageSchema.parse(input);
    if (JSON.stringify(page.sections).length > 600_000) {
      throw new UserError("This page has too much content. Remove a few sections.");
    }
    if (RESERVED_SLUGS.has(page.slug)) {
      throw new UserError(`“/${page.slug}” is used by a built-in page. Choose another URL.`);
    }
    if (id) {
      const [existing] = await db.select({ slug: pages.slug }).from(pages).where(eq(pages.id, id));
      if (!existing) throw new UserError("This page no longer exists.");
      if (existing.slug === "home" && (page.slug !== "home" || !page.published)) {
        throw new UserError("The home page must stay published at its current URL.");
      }
      await db
        .update(pages)
        .set({ ...page, updatedAt: new Date() })
        .where(eq(pages.id, id));
      updateTag(TAGS.pages);
      return { id };
    }
    const [created] = await db.insert(pages).values(page).returning({ id: pages.id });
    updateTag(TAGS.pages);
    return { id: created.id };
  });
}

export async function deletePageAction(id: string) {
  return guard(async () => {
    const deleted = await db
      .delete(pages)
      .where(and(eq(pages.id, id), ne(pages.slug, "home")))
      .returning({ id: pages.id });
    if (!deleted.length) throw new UserError("The home page can't be deleted.");
    updateTag(TAGS.pages);
    return {};
  });
}

/* ---------------------------------- categories ---------------------------------- */

const categorySchema = z.object({
  id: z.uuid().optional(),
  name: text(80).min(1, "Enter a name."),
  slug,
  description: optional(500),
  image: optionalImage,
  sortOrder: z.number().int().min(0).max(9999),
  active: z.boolean(),
});

export async function saveCategoryAction(input: unknown) {
  return guard(async () => {
    const { id, ...category } = categorySchema.parse(input);
    if (id) await db.update(categories).set(category).where(eq(categories.id, id));
    else await db.insert(categories).values(category);
    updateTag(TAGS.catalog);
    return {};
  });
}

export async function deleteCategoryAction(id: string) {
  return guard(async () => {
    await db.delete(categories).where(eq(categories.id, id));
    updateTag(TAGS.catalog);
    return {};
  });
}

/* ----------------------------------- products ----------------------------------- */

const productSchema = z.object({
  id: z.uuid().optional(),
  name: text(150).min(1, "Enter a product name."),
  slug,
  tagline: optional(200),
  description: optional(6000),
  categoryId: uuidOrNull,
  images: z.array(image.min(1)).max(12),
  gender: z.enum(["unisex", "women", "men"]),
  concentration: optional(60),
  scentFamily: optional(60),
  topNotes: tags,
  heartNotes: tags,
  baseNotes: tags,
  badge: optional(30),
  featured: z.boolean(),
  active: z.boolean(),
  seoTitle: optional(200),
  seoDescription: optional(400),
  variants: z
    .array(
      z.object({
        id: z.uuid().optional(),
        label: text(60).min(1, "Every size needs a label."),
        sku: optional(60),
        price: money,
        compareAtPrice: money.nullish(),
        stock: z.number().int().min(0).max(1_000_000),
      }),
    )
    .min(1, "Add at least one size with a price.")
    .max(20),
});

export async function saveProductAction(input: unknown) {
  return guard(async () => {
    const { id, variants, categoryId, ...fields } = productSchema.parse(input);
    const values = { ...fields, categoryId: categoryId ?? null };

    const productId = await db.transaction(async (tx) => {
      let pid = id;
      if (pid) {
        const updated = await tx
          .update(products)
          .set(values)
          .where(eq(products.id, pid))
          .returning({ id: products.id });
        if (!updated.length) throw new UserError("This product no longer exists.");
      } else {
        [{ id: pid }] = await tx.insert(products).values(values).returning({ id: products.id });
      }

      // A size submitted without an id may already exist (e.g. a second save before
      // the form refreshed) — match it by label instead of inserting a duplicate.
      const existing = await tx
        .select({ id: productVariants.id, label: productVariants.label })
        .from(productVariants)
        .where(eq(productVariants.productId, pid));
      const claimed = new Set(variants.flatMap((v) => (v.id ? [v.id] : [])));
      for (const variant of variants) {
        if (variant.id) continue;
        const match = existing.find((e) => e.label === variant.label && !claimed.has(e.id));
        if (match) {
          variant.id = match.id;
          claimed.add(match.id);
        }
      }

      const keep = variants.flatMap((v) => (v.id ? [v.id] : []));
      await tx
        .delete(productVariants)
        .where(
          keep.length
            ? and(eq(productVariants.productId, pid), notInArray(productVariants.id, keep))
            : eq(productVariants.productId, pid),
        );
      for (const [index, variant] of variants.entries()) {
        const row = {
          label: variant.label,
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice || null,
          stock: variant.stock,
          sortOrder: index,
        };
        if (variant.id) {
          await tx
            .update(productVariants)
            .set(row)
            .where(and(eq(productVariants.id, variant.id), eq(productVariants.productId, pid)));
        } else {
          await tx.insert(productVariants).values({ ...row, productId: pid });
        }
      }
      return pid;
    });

    updateTag(TAGS.catalog);
    return { id: productId };
  });
}

export async function deleteProductAction(id: string) {
  return guard(async () => {
    await db.delete(products).where(eq(products.id, id));
    updateTag(TAGS.catalog);
    return {};
  });
}

/* -------------------------------- builder options -------------------------------- */

const builderOptionSchema = z.object({
  id: z.uuid().optional(),
  step: text(40).min(1, "Choose a step."),
  name: text(80).min(1, "Enter a name."),
  description: optional(300),
  family: optional(40),
  color: z.preprocess((v) => (v === "" ? null : v), hex.nullish()).transform((v) => v ?? null),
  image: optionalImage,
  priceDelta: money,
  sortOrder: z.number().int().min(0).max(9999),
  active: z.boolean(),
});

export async function saveBuilderOptionAction(input: unknown) {
  return guard(async () => {
    const { id, ...option } = builderOptionSchema.parse(input);
    if (id) await db.update(builderOptions).set(option).where(eq(builderOptions.id, id));
    else await db.insert(builderOptions).values(option);
    updateTag(TAGS.builder);
    return {};
  });
}

export async function deleteBuilderOptionAction(id: string) {
  return guard(async () => {
    await db.delete(builderOptions).where(eq(builderOptions.id, id));
    updateTag(TAGS.builder);
    return {};
  });
}

/* ----------------------------------- coupons ----------------------------------- */

const couponSchema = z
  .object({
    id: z.uuid().optional(),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,30}$/, "Codes use 3–30 letters, numbers, dashes or underscores."),
    type: z.enum(["percent", "fixed"]),
    percentOff: z.number().int().min(0).max(100, "A percentage can't exceed 100.").default(0),
    amountOff: money.default(0),
    minSubtotal: money,
    maxUses: z.number().int().min(0).nullish(),
    expiresAt: z.preprocess(
      (v) => (v ? new Date(String(v)) : null),
      z.date("Enter a valid expiry date.").nullable(),
    ),
    active: z.boolean(),
  })
  .refine(
    (c) => (c.type === "percent" ? c.percentOff : c.amountOff) > 0,
    "Enter how much the code takes off.",
  );

export async function saveCouponAction(input: unknown) {
  return guard(async () => {
    const { id, maxUses, percentOff, amountOff, ...coupon } = couponSchema.parse(input);
    const values = {
      ...coupon,
      value: coupon.type === "percent" ? percentOff : amountOff,
      maxUses: maxUses || null,
    };
    if (id) await db.update(coupons).set(values).where(eq(coupons.id, id));
    else await db.insert(coupons).values(values);
    return {};
  });
}

export async function deleteCouponAction(id: string) {
  return guard(async () => {
    await db.delete(coupons).where(eq(coupons.id, id));
    return {};
  });
}

/* ------------------------------------ orders ------------------------------------ */

const orderUpdateSchema = z.object({
  id: z.uuid(),
  status: z.enum(ORDER_STATUSES),
  paymentStatus: z.enum(PAYMENT_STATUSES),
  trackingNumber: optional(100),
  trackingUrl: optional(400).refine((v) => !v || /^https?:\/\//.test(v), "Tracking links must start with https://"),
  adminNote: optional(2000),
});

export async function updateOrderAction(input: unknown) {
  return guard(async () => {
    const { id, ...changes } = orderUpdateSchema.parse(input);
    const restocked = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ status: orders.status })
        .from(orders)
        .where(eq(orders.id, id))
        .for("update");
      if (!current) throw new UserError("This order no longer exists.");
      if (current.status === "cancelled" && changes.status !== "cancelled") {
        throw new UserError("A cancelled order can't be reopened — its stock was already returned.");
      }
      await tx
        .update(orders)
        .set({ ...changes, updatedAt: new Date() })
        .where(eq(orders.id, id));

      // Cancelling puts the reserved stock back on the shelf.
      const cancelling = changes.status === "cancelled" && current.status !== "cancelled";
      if (!cancelling) return false;
      const items = await tx
        .select({ variantId: orderItems.variantId, quantity: orderItems.quantity })
        .from(orderItems)
        .where(eq(orderItems.orderId, id));
      for (const item of items) {
        if (!item.variantId) continue;
        await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
          .where(eq(productVariants.id, item.variantId));
      }
      return true;
    });
    if (restocked) updateTag(TAGS.catalog);
    return {};
  });
}

/* ------------------------------ reviews, inbox, media ------------------------------ */

export async function setReviewApprovedAction(id: string, approved: boolean) {
  return guard(async () => {
    await db.update(reviews).set({ approved }).where(eq(reviews.id, id));
    updateTag(TAGS.catalog);
    return {};
  });
}

export async function deleteReviewAction(id: string) {
  return guard(async () => {
    await db.delete(reviews).where(eq(reviews.id, id));
    updateTag(TAGS.catalog);
    return {};
  });
}

export async function setMessageReadAction(id: string, read: boolean) {
  return guard(async () => {
    await db.update(messages).set({ read }).where(eq(messages.id, id));
    return {};
  });
}

export async function deleteMessageAction(id: string) {
  return guard(async () => {
    await db.delete(messages).where(eq(messages.id, id));
    return {};
  });
}

export async function deleteSubscriberAction(id: string) {
  return guard(async () => {
    await db.delete(subscribers).where(eq(subscribers.id, id));
    return {};
  });
}

export type MediaItem = { id: string; url: string; filename: string; size: number };

export async function listMediaAction() {
  return guard(async () => {
    const rows = await db
      .select({ id: media.id, filename: media.filename, size: media.size })
      .from(media)
      .orderBy(desc(media.createdAt))
      .limit(300);
    const items: MediaItem[] = rows.map((r) => ({ ...r, url: `/api/media/${r.id}` }));
    return { items };
  });
}

export async function deleteMediaAction(ids: string[]) {
  return guard(async () => {
    const parsed = z.array(z.uuid()).min(1).max(100).parse(ids);
    await db.delete(media).where(inArray(media.id, parsed));
    return {};
  });
}

/* ------------------------------------- team ------------------------------------- */

export async function setUserRoleAction(id: string, role: "customer" | "admin") {
  return guard(async () => {
    const me = await requireAdmin();
    if (id === me.id) throw new UserError("You can't change your own role.");
    const parsedRole = z.enum(["customer", "admin"]).parse(role);
    await db.update(users).set({ role: parsedRole }).where(eq(users.id, z.uuid().parse(id)));
    return {};
  });
}
