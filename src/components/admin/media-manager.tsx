"use client";

import { Check, Copy, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deleteMediaAction, type MediaItem } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";
import { ui } from "./ui";
import { uploadImage } from "./upload";

function size(bytes: number) {
  return bytes > 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function MediaManager({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    try {
      for (const file of Array.from(files)) await uploadImage(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void upload(e.dataTransfer.files);
        }}
        className="mb-5 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 bg-white px-6 py-10 text-center"
      >
        <Upload className="size-6 text-zinc-400" />
        <p className="text-sm text-zinc-600">
          Drag images here, or{" "}
          <button type="button" onClick={() => fileRef.current?.click()} className="font-medium text-zinc-900 underline">
            choose files
          </button>
        </p>
        <p className="text-xs text-zinc-400">
          JPG, PNG, WebP, GIF or SVG. Photos are resized and compressed automatically.
        </p>
        {busy && <p className="text-sm font-medium text-zinc-700">Uploading…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">Your library is empty.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item) => (
            <li key={item.id} className={cn(ui.card, "overflow-hidden")}>
              <div className="aspect-square bg-zinc-50">
                <img src={item.url} alt={item.filename} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="p-2.5">
                <p className="truncate text-xs font-medium text-zinc-800" title={item.filename}>
                  {item.filename}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">{size(item.size)}</span>
                  <span className="flex">
                    <button
                      type="button"
                      className={ui.btnIcon}
                      title="Copy image URL"
                      aria-label="Copy image URL"
                      onClick={async () => {
                        await navigator.clipboard.writeText(item.url);
                        setCopied(item.id);
                        setTimeout(() => setCopied(null), 1500);
                      }}
                    >
                      {copied === item.id ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                    </button>
                    <button
                      type="button"
                      className={ui.btnIcon}
                      title="Delete"
                      aria-label="Delete image"
                      disabled={pending}
                      onClick={() => {
                        if (!window.confirm("Delete this image? Anywhere it is used will show a broken image.")) return;
                        start(async () => {
                          const result = await deleteMediaAction([item.id]);
                          if (!result.ok) setError(result.error);
                          router.refresh();
                        });
                      }}
                    >
                      <Trash2 className="size-4 text-red-600" />
                    </button>
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
