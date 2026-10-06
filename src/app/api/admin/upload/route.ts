import { db } from "@/db";
import { media } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
]);
// Vercel rejects request bodies above 4.5 MB; the admin UI compresses photos well below this.
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return Response.json({ error: "Not authorised." }, { status: 401 });
  }
  // Session cookies are SameSite=Lax; this origin check is a second guard against cross-site posts.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return Response.json({ error: "Invalid origin." }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file received." }, { status: 400 });
  if (!ALLOWED.has(file.type)) {
    return Response.json({ error: "Upload a JPG, PNG, WebP, AVIF, GIF or SVG image." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "That image is too large (4 MB maximum)." }, { status: 400 });
  }

  const [row] = await db
    .insert(media)
    .values({
      filename: file.name.slice(0, 200) || "image",
      mime: file.type,
      size: file.size,
      data: Buffer.from(await file.arrayBuffer()),
    })
    .returning({ id: media.id });
  return Response.json({ id: row.id, url: `/api/media/${row.id}` });
}
