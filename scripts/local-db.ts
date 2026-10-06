/**
 * Zero-install local Postgres for development: runs PGlite (Postgres compiled to
 * WebAssembly) and exposes it on a TCP port, storing data in ./.data/pg.
 * Production uses Neon — this is only a convenience for working offline.
 */
import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

async function main() {
  const port = Number(process.env.LOCAL_DB_PORT ?? 5433);
  mkdirSync(".data", { recursive: true });
  const db = await PGlite.create(".data/pg");
  const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1", maxConnections: 20 });
  await server.start();
  console.log(`Local Postgres ready on postgres://postgres:postgres@127.0.0.1:${port}/postgres`);
  console.log("Leave this running, then use `npm run db:setup` and `npm run dev` in another terminal.");

  const stop = async () => {
    await server.stop();
    await db.close();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
