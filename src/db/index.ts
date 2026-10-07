import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

// Only the connection pool is shared across hot reloads. The query builder is
// rebuilt whenever this module reloads, so it always sees the current schema.
const globalForDb = globalThis as unknown as { __perfumePool?: Pool };

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to .env (see .env.example).",
    );
  }
  const pool = new Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX ?? 5),
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 15_000,
  });
  // Lets Vercel close idle connections before a function instance is suspended.
  attachDatabasePool(pool);
  return pool;
}

let current: Database | undefined;

function instance(): Database {
  return (current ??= drizzle((globalForDb.__perfumePool ??= createPool()), { schema }));
}

/**
 * Connects on first use rather than on import, so `next build` can load route
 * modules without a database being reachable.
 */
export const db = new Proxy({} as Database, {
  get(_target, prop) {
    const real = instance();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
