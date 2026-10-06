/**
 * Prepares the database: applies migrations, loads demo content into an empty
 * database, and creates the first admin account. Safe to run repeatedly — it runs
 * before every build so a fresh Vercel + Neon deployment needs no manual steps.
 *
 *   npm run db:setup            migrate, seed if empty, create the admin if missing
 *   npm run admin:reset         also reset the admin password from ADMIN_PASSWORD
 */
import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { DEFAULT_SETTINGS, SETTINGS_KEYS } from "../src/lib/config";
import { DEMO_IMAGES } from "../src/lib/demo-images";
import {
  seedBuilderOptions,
  seedCategories,
  seedPages,
  seedProducts,
  seedReviews,
} from "./seed-data";

loadEnvConfig(process.cwd());

type Db = ReturnType<typeof drizzle<typeof schema>>;

async function seed(db: Db) {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.pages);
  if (count > 0) {
    console.log("• Content already present — skipping demo data.");
    return;
  }
  console.log("• Empty database — loading demo content…");

  await db
    .insert(schema.settings)
    .values(SETTINGS_KEYS.map((key) => ({ key, value: DEFAULT_SETTINGS[key] as Record<string, unknown> })))
    .onConflictDoNothing();

  await db.insert(schema.pages).values(seedPages);

  const categories = await db
    .insert(schema.categories)
    .values(seedCategories)
    .returning({ id: schema.categories.id, slug: schema.categories.slug });
  const categoryId = new Map(categories.map((c) => [c.slug, c.id]));

  const productId = new Map<string, string>();
  for (const { category, price, compareAt, ...product } of seedProducts) {
    const [row] = await db
      .insert(schema.products)
      .values({
        ...product,
        categoryId: categoryId.get(category) ?? null,
        concentration: product.badge === "Extrait" ? "Extrait de Parfum" : "Eau de Parfum",
        images: DEMO_IMAGES.products[product.slug] ?? [],
      })
      .returning({ id: schema.products.id });
    productId.set(product.slug, row.id);

    const round = (n: number) => Math.round(n / 10000) * 10000 - 1000;
    await db.insert(schema.productVariants).values([
      { productId: row.id, label: "30 ml", price: round(price * 0.65), stock: 25, sortOrder: 0 },
      {
        productId: row.id,
        label: "50 ml",
        price,
        compareAtPrice: compareAt ?? null,
        stock: 40,
        sortOrder: 1,
      },
      { productId: row.id, label: "100 ml", price: round(price * 1.6), stock: 15, sortOrder: 2 },
    ]);
  }

  await db.insert(schema.builderOptions).values(
    seedBuilderOptions.map(([step, name, description, family, color, priceDelta], index) => ({
      step,
      name,
      description,
      family,
      color,
      priceDelta,
      sortOrder: index,
    })),
  );

  await db.insert(schema.reviews).values(
    seedReviews.map(([slug, name, rating, title, body]) => ({
      productId: productId.get(slug)!,
      name,
      rating,
      title,
      body,
      approved: true,
    })),
  );

  await db.insert(schema.coupons).values({
    code: "WELCOME10",
    type: "percent",
    value: 10,
    minSubtotal: 0,
  });
  console.log("• Demo content loaded (coupon WELCOME10 gives 10% off).");
}

async function ensureAdmin(db: Db, reset: boolean) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const [admin] = await db
    .select({ id: schema.users.id, email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.role, "admin"))
    .limit(1);

  if (admin && !reset) {
    console.log(`• Admin account exists (${admin.email}).`);
    return;
  }
  if (!email || !password) {
    console.warn(
      "! No admin account was created: set ADMIN_EMAIL and ADMIN_PASSWORD, then run `npm run db:setup` (or redeploy).",
    );
    return;
  }
  if (password.length < 8) {
    console.warn("! ADMIN_PASSWORD must be at least 8 characters — admin account not created.");
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await db
    .insert(schema.users)
    .values({ name: "Store Admin", email, passwordHash, role: "admin" })
    .onConflictDoUpdate({ target: schema.users.email, set: { passwordHash, role: "admin" } });
  console.log(`• Admin account ${reset ? "reset" : "created"}: ${email}`);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    const message = "DATABASE_URL is not set — add your Neon connection string (see .env.example).";
    // A deployment without a database can't work, so fail the build loudly there.
    if (process.env.VERCEL) throw new Error(message);
    console.warn(`! ${message} Skipping database setup.`);
    return;
  }

  if (process.env.VERCEL && !process.env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET is not set — add it in Vercel → Settings → Environment Variables.");
  }

  const pool = new Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool, { schema });
  try {
    console.log("• Applying migrations…");
    await migrate(db, { migrationsFolder: "./drizzle" });
    await seed(db);
    await ensureAdmin(db, process.argv.includes("--reset-admin"));
    console.log("✓ Database ready.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("✗ Database setup failed:", error);
  process.exit(1);
});
