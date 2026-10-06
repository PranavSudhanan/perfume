"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Monitor,
  Plus,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { SectionData } from "@/db/schema";
import { deletePageAction, savePageAction } from "@/lib/actions/admin";
import type { FieldSources } from "@/lib/fields";
import { createSection, SECTION_DEFS, SECTION_MAP } from "@/lib/sections";
import { cn, slugify, uid } from "@/lib/utils";
import { SaveBar } from "./crud";
import { FormFields, Toggle } from "./fields";
import { ui } from "./ui";

export type EditablePage = {
  id?: string;
  slug: string;
  title: string;
  sections: SectionData[];
  published: boolean;
  seoTitle: string;
  seoDescription: string;
};

/** A one-line description of a section for its collapsed row. */
function summary(section: SectionData) {
  const p = section.props;
  const slides = Array.isArray(p.slides) ? (p.slides as { title?: string }[]) : null;
  const text = p.title ?? slides?.[0]?.title ?? (Array.isArray(p.items) ? `${p.items.length} items` : "");
  return typeof text === "string" ? text : "";
}

export function PageEditor({ page, sources }: { page: EditablePage; sources: FieldSources }) {
  const router = useRouter();
  const isHome = page.slug === "home" && !!page.id;
  const [value, setValue] = useState(page);
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [preview, setPreview] = useState<"desktop" | "mobile" | null>(null);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const change = (next: EditablePage) => {
    setValue(next);
    setDirty(true);
    setStatus(null);
  };
  const setSections = (sections: SectionData[]) => change({ ...value, sections });
  const patch = (id: string, changes: Partial<SectionData>) =>
    setSections(value.sections.map((s) => (s.id === id ? { ...s, ...changes } : s)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.sections.length || from === to) return;
    const next = [...value.sections];
    next.splice(to, 0, next.splice(from, 1)[0]);
    setSections(next);
  };

  const save = () =>
    start(async () => {
      const result = await savePageAction(value);
      if (!result.ok) {
        setStatus({ ok: false, text: result.error });
        return;
      }
      setDirty(false);
      setStatus({ ok: true, text: "Saved — your storefront is updated" });
      setPreviewVersion((v) => v + 1);
      if (!value.id) {
        setValue({ ...value, id: result.id });
        router.replace(`/admin/pages/${result.id}`);
      } else {
        router.refresh();
      }
    });

  const remove = () => {
    if (!value.id || !window.confirm("Delete this page permanently?")) return;
    start(async () => {
      const result = await deletePageAction(value.id!);
      if (!result.ok) {
        setStatus({ ok: false, text: result.error });
        return;
      }
      setDirty(false);
      router.replace("/admin/pages");
      router.refresh();
    });
  };

  const publicPath = isHome ? "/" : `/${value.slug}`;

  return (
    <div>
      <section className={cn(ui.card, "mb-5 p-5")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={ui.label}>Page title</span>
            <input
              value={value.title}
              onChange={(e) => {
                const title = e.target.value;
                // New pages get their URL from the title until the slug is edited by hand.
                const auto = !value.id && value.slug === slugify(value.title);
                change({ ...value, title, slug: auto ? slugify(title) : value.slug });
              }}
              className={ui.input}
            />
          </label>
          <label className="block">
            <span className={ui.label}>URL</span>
            <div className="flex items-center">
              <span className="rounded-l-lg border border-r-0 border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
                /
              </span>
              <input
                value={isHome ? "" : value.slug}
                disabled={isHome}
                placeholder={isHome ? "(home page)" : "about-us"}
                onChange={(e) => change({ ...value, slug: e.target.value })}
                className={cn(ui.input, "rounded-l-none disabled:bg-zinc-50")}
              />
            </div>
          </label>
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-900">
            Search engine settings
          </summary>
          <div className="mt-3 grid gap-4">
            <label className="block">
              <span className={ui.label}>Page title for search engines</span>
              <input
                value={value.seoTitle}
                onChange={(e) => change({ ...value, seoTitle: e.target.value })}
                className={ui.input}
              />
            </label>
            <label className="block">
              <span className={ui.label}>Meta description</span>
              <textarea
                value={value.seoDescription}
                onChange={(e) => change({ ...value, seoDescription: e.target.value })}
                rows={2}
                className={cn(ui.input, "resize-y")}
              />
            </label>
          </div>
        </details>
        {!isHome && (
          <div className="mt-4 border-t border-zinc-100 pt-4">
            <Toggle
              label="Published (visible to visitors)"
              checked={value.published}
              onChange={(published) => change({ ...value, published })}
            />
          </div>
        )}
      </section>

      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Sections</h2>
          <p className="text-sm text-zinc-500">
            Sections stack top to bottom. Drag to reorder, click to edit, hide without deleting.
          </p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className={ui.btn}>
          <Plus className="size-4" /> Add section
        </button>
      </div>

      {value.sections.length === 0 && (
        <div className={cn(ui.card, "px-6 py-12 text-center text-sm text-zinc-500")}>
          This page is empty. Add a section to get started.
        </div>
      )}

      <ol className="space-y-2">
        {value.sections.map((section, index) => {
          const def = SECTION_MAP[section.type];
          const expanded = open === section.id;
          return (
            <li
              key={section.id}
              onDragOver={(e) => {
                if (dragging === null) return;
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragging !== null) move(dragging, index);
                setDragging(null);
              }}
              className={cn(
                ui.card,
                "overflow-hidden transition",
                dragging === index && "opacity-40",
                !section.enabled && "bg-zinc-50",
              )}
            >
              <div className="flex items-center gap-1 px-2 py-2">
                <span
                  draggable
                  onDragStart={(e) => {
                    setDragging(index);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => setDragging(null)}
                  className="cursor-grab p-1.5 text-zinc-400 active:cursor-grabbing"
                  title="Drag to reorder"
                >
                  <GripVertical className="size-4" />
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : section.id)}
                  aria-expanded={expanded}
                  className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left"
                >
                  <span className={cn("shrink-0 text-sm font-semibold", !section.enabled && "text-zinc-400")}>
                    {def?.label ?? section.type}
                  </span>
                  <span className="min-w-0 truncate text-sm text-zinc-500">{summary(section)}</span>
                  {!section.enabled && (
                    <span className="shrink-0 rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                      Hidden
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => patch(section.id, { enabled: !section.enabled })}
                  className={ui.btnIcon}
                  aria-label={section.enabled ? "Hide section" : "Show section"}
                  title={section.enabled ? "Hide on the storefront" : "Show on the storefront"}
                >
                  {section.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
                <button type="button" disabled={index === 0} onClick={() => move(index, index - 1)} className={ui.btnIcon} aria-label="Move up">
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={index === value.sections.length - 1}
                  onClick={() => move(index, index + 1)}
                  className={ui.btnIcon}
                  aria-label="Move down"
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const copy = { ...structuredClone(section), id: uid() };
                    const next = [...value.sections];
                    next.splice(index + 1, 0, copy);
                    setSections(next);
                    setOpen(copy.id);
                  }}
                  className={ui.btnIcon}
                  aria-label="Duplicate section"
                  title="Duplicate"
                >
                  <Copy className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Remove this “${def?.label ?? section.type}” section?`)) {
                      setSections(value.sections.filter((s) => s.id !== section.id));
                    }
                  }}
                  className={ui.btnIcon}
                  aria-label="Delete section"
                  title="Delete"
                >
                  <Trash2 className="size-4 text-red-600" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : section.id)}
                  className={ui.btnIcon}
                  aria-label={expanded ? "Collapse" : "Edit section"}
                >
                  <ChevronDown className={cn("size-4 transition", expanded && "rotate-180")} />
                </button>
              </div>
              {expanded && def && (
                <div className="border-t border-zinc-100 p-5">
                  <FormFields
                    fields={def.fields}
                    value={section.props}
                    sources={sources}
                    onChange={(props) => patch(section.id, { props })}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <SaveBar dirty={dirty} pending={pending} status={status} onSave={save} label={value.id ? "Save page" : "Create page"}>
        {value.id && !isHome && (
          <button type="button" onClick={remove} disabled={pending} className={ui.btnDanger}>
            <Trash2 className="size-4" /> Delete page
          </button>
        )}
        {value.id && (
          <button type="button" onClick={() => setPreview("desktop")} className={ui.btnSecondary}>
            <Eye className="size-4" /> Preview
          </button>
        )}
      </SaveBar>

      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setAdding(false)}>
          <div
            role="dialog"
            aria-label="Add a section"
            className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <h3 className="font-semibold">Add a section</h3>
              <button type="button" onClick={() => setAdding(false)} className={ui.btnIcon} aria-label="Close">
                <X className="size-4" />
              </button>
            </header>
            <div className="grid gap-3 overflow-y-auto p-5 sm:grid-cols-2">
              {SECTION_DEFS.map((def) => (
                <button
                  key={def.type}
                  type="button"
                  onClick={() => {
                    const section = createSection(def.type);
                    setSections([...value.sections, section]);
                    setOpen(section.id);
                    setAdding(false);
                  }}
                  className="rounded-lg border border-zinc-200 p-4 text-left transition hover:border-zinc-900 hover:bg-zinc-50"
                >
                  <span className="block text-sm font-semibold text-zinc-900">{def.label}</span>
                  <span className="mt-0.5 block text-sm text-zinc-500">{def.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-900/80 p-3 md:p-6">
          <div className="mb-3 flex items-center justify-between gap-3 text-white">
            <p className="text-sm">
              Preview of <span className="font-medium">{publicPath}</span>
              {dirty && <span className="ml-2 text-amber-300">— save to see your latest edits</span>}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPreview("desktop")}
                aria-pressed={preview === "desktop"}
                className={cn("rounded-md p-2", preview === "desktop" ? "bg-white text-zinc-900" : "hover:bg-white/10")}
                aria-label="Desktop preview"
              >
                <Monitor className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreview("mobile")}
                aria-pressed={preview === "mobile"}
                className={cn("rounded-md p-2", preview === "mobile" ? "bg-white text-zinc-900" : "hover:bg-white/10")}
                aria-label="Mobile preview"
              >
                <Smartphone className="size-4" />
              </button>
              <button type="button" onClick={() => setPreview(null)} className="ml-2 rounded-md p-2 hover:bg-white/10" aria-label="Close preview">
                <X className="size-5" />
              </button>
            </div>
          </div>
          <iframe
            key={previewVersion}
            src={publicPath}
            title="Page preview"
            className={cn(
              "mx-auto h-full w-full flex-1 rounded-lg bg-white shadow-2xl",
              preview === "mobile" && "max-w-[400px]",
            )}
          />
        </div>
      )}
    </div>
  );
}
