"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Copy,
  FolderOpen,
  ImageIcon,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { listMediaAction, type MediaItem } from "@/lib/actions/admin";
import { emptyItem, type Field, type FieldSources } from "@/lib/fields";
import { cn } from "@/lib/utils";
import { ui } from "./ui";
import { uploadImage } from "./upload";

type Value = Record<string, unknown>;

/** Renders a set of field descriptors as a form bound to a plain object. */
export function FormFields({
  fields,
  value,
  onChange,
  sources,
}: {
  fields: Field[];
  value: Value;
  onChange: (next: Value) => void;
  sources?: FieldSources;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.name} className={field.half ? "" : "sm:col-span-2"}>
          <FieldControl
            field={field}
            value={value[field.name]}
            onChange={(v) => onChange({ ...value, [field.name]: v })}
            sources={sources}
          />
        </div>
      ))}
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange,
  sources,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
  sources?: FieldSources;
}) {
  if (field.type === "boolean") {
    return (
      <div>
        <Toggle label={field.label} checked={value === true} onChange={onChange} />
        {field.help && <p className={cn(ui.help, "ml-12")}>{field.help}</p>}
      </div>
    );
  }

  let control: React.ReactNode;
  const text = typeof value === "string" ? value : value == null ? "" : String(value);

  switch (field.type) {
    case "textarea":
    case "markdown":
      control = (
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          rows={field.type === "markdown" ? 8 : 3}
          placeholder={field.placeholder}
          className={cn(ui.input, "resize-y", field.type === "markdown" && "font-mono text-[13px]")}
        />
      );
      break;
    case "number":
      control = (
        <input
          type="number"
          value={typeof value === "number" ? value : text}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          placeholder={field.placeholder}
          className={ui.input}
        />
      );
      break;
    case "money":
      control = <MoneyInput value={typeof value === "number" ? value : 0} onChange={onChange} />;
      break;
    case "color":
      control = <ColorInput value={text} onChange={onChange} />;
      break;
    case "select": {
      const options = field.options ?? sources?.[field.source ?? ""] ?? [];
      control = (
        <select value={text} onChange={(e) => onChange(e.target.value)} className={cn(ui.input, "cursor-pointer")}>
          {field.allowEmpty !== undefined && <option value="">{field.allowEmpty}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    }
    case "image":
      control = <ImageInput value={text} onChange={onChange} />;
      break;
    case "images":
      control = <ImagesInput value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />;
      break;
    case "tags":
      control = (
        <TagsInput
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
          placeholder={field.placeholder}
        />
      );
      break;
    case "list":
      control = (
        <ListEditor
          field={field}
          value={Array.isArray(value) ? (value as Value[]) : []}
          onChange={onChange}
          sources={sources}
        />
      );
      break;
    case "datetime":
      control = (
        <input type="datetime-local" value={text} onChange={(e) => onChange(e.target.value)} className={ui.input} />
      );
      break;
    default:
      control = (
        <input
          type="text"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? (field.type === "link" ? "/shop or https://…" : undefined)}
          className={ui.input}
        />
      );
  }

  const help =
    field.help ??
    (field.type === "markdown"
      ? "Formatting: **bold**, *italic*, [link](https://…), ## heading, - list item. Leave a blank line between paragraphs."
      : undefined);

  return (
    <div>
      <label className={ui.label}>{field.label}</label>
      {control}
      {help && <p className={ui.help}>{help}</p>}
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition",
          checked ? "bg-emerald-600" : "bg-zinc-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-4",
          )}
        />
      </button>
      <span className="text-sm font-medium text-zinc-700">{label}</span>
    </label>
  );
}

/** Edits an amount in major units (12.50) while the stored value stays in minor units (1250). */
function MoneyInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value ? String(value / 100) : "");
  return (
    <input
      type="number"
      inputMode="decimal"
      min="0"
      step="0.01"
      value={shown}
      placeholder="0"
      onChange={(e) => {
        setDraft(e.target.value);
        const parsed = Number.parseFloat(e.target.value);
        onChange(Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100)) : 0);
      }}
      onBlur={() => setDraft(null)}
      className={ui.input}
    />
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const valid = /^#[0-9a-f]{6}$/i.test(value);
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={valid ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-zinc-300 bg-white p-0.5"
        aria-label="Pick a colour"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder="#a07a35"
        className={cn(ui.input, "font-mono")}
      />
      {value && (
        <button type="button" onClick={() => onChange("")} className={ui.btnIcon} aria-label="Clear colour">
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

function TagsInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const commit = () => {
    const next = draft
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (next.length) onChange([...value, ...next]);
    setDraft("");
  };
  return (
    <div className={cn(ui.input, "flex flex-wrap items-center gap-1.5 py-1.5")}>
      {value.map((tag, i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded-md bg-zinc-100 py-1 pr-1 pl-2 text-sm">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="rounded p-0.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900"
            aria-label={`Remove ${tag}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        placeholder={value.length ? "" : (placeholder ?? "Type and press Enter")}
        className="min-w-32 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-zinc-400"
      />
    </div>
  );
}

function MediaPicker({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listMediaAction().then((res) => {
      if (cancelled) return;
      if (res.ok) setItems(res.items);
      else setError(res.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Media library"
        className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h3 className="font-semibold">Choose from library</h3>
          <button type="button" onClick={onClose} className={ui.btnIcon} aria-label="Close">
            <X className="size-4" />
          </button>
        </header>
        <div className="overflow-y-auto p-5">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!items && !error && <p className="text-sm text-zinc-500">Loading…</p>}
          {items?.length === 0 && (
            <p className="py-10 text-center text-sm text-zinc-500">
              No uploads yet. Use “Upload” to add your first image.
            </p>
          )}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {items?.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onPick(item.url)}
                title={item.filename}
                className="aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 transition hover:ring-2 hover:ring-zinc-900"
              >
                <img src={item.url} alt={item.filename} loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ImageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [picker, setPicker] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await uploadImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="size-6 text-zinc-300" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className={ui.btnSecondary}>
            <Upload className="size-4" /> {busy ? "Uploading…" : "Upload"}
          </button>
          <button type="button" onClick={() => setPicker(true)} className={ui.btnSecondary}>
            <FolderOpen className="size-4" /> Library
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")} className={ui.btnDanger}>
              Remove
            </button>
          )}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…or paste an image URL"
          className={cn(ui.input, "text-xs")}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
      {picker && (
        <MediaPicker
          onClose={() => setPicker(false)}
          onPick={(url) => {
            onChange(url);
            setPicker(false);
          }}
        />
      )}
    </div>
  );
}

function ImagesInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [picker, setPicker] = useState(false);
  const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    const added: string[] = [];
    try {
      for (const file of Array.from(files)) added.push(await uploadImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      if (added.length) onChange([...value, ...added]);
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const move = (from: number, to: number) => {
    const next = [...value];
    next.splice(to, 0, next.splice(from, 1)[0]);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {value.map((src, i) => (
            <div key={`${src}-${i}`} className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
              <img src={src} alt="" className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 rounded bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Main
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-white/90 p-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} className={ui.btnIcon} aria-label="Move earlier">
                  <ArrowLeft className="size-3.5" />
                </button>
                <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className={ui.btnIcon} aria-label="Remove image">
                  <Trash2 className="size-3.5 text-red-600" />
                </button>
                <button type="button" disabled={i === value.length - 1} onClick={() => move(i, i + 1)} className={ui.btnIcon} aria-label="Move later">
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className={ui.btnSecondary}>
          <Upload className="size-4" /> {busy ? "Uploading…" : "Upload images"}
        </button>
        <button type="button" onClick={() => setPicker(true)} className={ui.btnSecondary}>
          <FolderOpen className="size-4" /> Library
        </button>
        <div className="flex min-w-52 flex-1 gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="…or paste an image URL"
            className={cn(ui.input, "text-xs")}
          />
          <button
            type="button"
            disabled={!url.trim()}
            onClick={() => {
              onChange([...value, url.trim()]);
              setUrl("");
            }}
            className={ui.btnSecondary}
          >
            Add
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
      {picker && (
        <MediaPicker
          onClose={() => setPicker(false)}
          onPick={(picked) => {
            onChange([...value, picked]);
            setPicker(false);
          }}
        />
      )}
    </div>
  );
}

/** Repeating group of sub-fields (slides, sizes, FAQ entries, menu links…). */
function ListEditor({
  field,
  value,
  onChange,
  sources,
}: {
  field: Extract<Field, { type: "list" }>;
  value: Value[];
  onChange: (v: Value[]) => void;
  sources?: FieldSources;
}) {
  const [open, setOpen] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    const next = [...value];
    next.splice(to, 0, next.splice(from, 1)[0]);
    onChange(next);
    setOpen(open === from ? to : open === to ? from : open);
  };

  return (
    <div className="space-y-2">
      {value.map((item, i) => {
        const title = field.titleField ? String(item[field.titleField] ?? "") : "";
        const expanded = open === i;
        return (
          <div key={i} className="rounded-lg border border-zinc-200 bg-zinc-50/60">
            <div className="flex items-center gap-1 px-2 py-1.5">
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : i)}
                aria-expanded={expanded}
                className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1 text-left text-sm"
              >
                <ChevronDown className={cn("size-4 shrink-0 text-zinc-400 transition", expanded && "rotate-180")} />
                <span className="truncate font-medium text-zinc-800">
                  {title || `${field.itemLabel} ${i + 1}`}
                </span>
              </button>
              <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} className={ui.btnIcon} aria-label="Move up">
                <ArrowUp className="size-4" />
              </button>
              <button type="button" disabled={i === value.length - 1} onClick={() => move(i, i + 1)} className={ui.btnIcon} aria-label="Move down">
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  // A copy must not keep the original's database id.
                  const copy = structuredClone(item);
                  delete copy.id;
                  onChange([...value.slice(0, i + 1), copy, ...value.slice(i + 1)]);
                }}
                className={ui.btnIcon}
                aria-label="Duplicate"
              >
                <Copy className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(value.filter((_, j) => j !== i));
                  setOpen(null);
                }}
                className={ui.btnIcon}
                aria-label="Delete"
              >
                <Trash2 className="size-4 text-red-600" />
              </button>
            </div>
            {expanded && (
              <div className="border-t border-zinc-200 bg-white p-4">
                <FormFields
                  fields={field.fields}
                  value={item}
                  onChange={(next) => onChange(value.map((v, j) => (j === i ? next : v)))}
                  sources={sources}
                />
              </div>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => {
          onChange([...value, emptyItem(field.fields)]);
          setOpen(value.length);
        }}
        className={ui.btnSecondary}
      >
        <Plus className="size-4" /> Add {field.itemLabel.toLowerCase()}
      </button>
    </div>
  );
}
