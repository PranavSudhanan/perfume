"use client";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { Field, FieldSources, Option } from "@/lib/fields";
import type { ActionResult } from "@/lib/result";
import { cn, formatMoney, slugify, type MoneyFormat } from "@/lib/utils";
import { FormFields } from "./fields";
import { ui } from "./ui";

type Value = Record<string, unknown>;
/** A save may add a note for the admin, e.g. whether an email went out; `warning` flags a problem. */
type SaveAction = (
  value: unknown,
) => Promise<ActionResult<{ id?: string; message?: string; warning?: boolean }>>;
type Status = { ok: boolean; text: string; warning?: boolean } | null;

/** Keeps `slug` in step with the name while the admin hasn't hand-edited it. */
function withAutoSlug(previous: Value, next: Value, slugFrom?: string): Value {
  if (!slugFrom || previous.id || next[slugFrom] === previous[slugFrom]) return next;
  const auto = slugify(String(previous[slugFrom] ?? ""));
  if (previous.slug && previous.slug !== auto) return next;
  return { ...next, slug: slugify(String(next[slugFrom] ?? "")) };
}

/** Warns before leaving the page with unsaved edits. */
function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
}

export function SaveBar({
  dirty,
  pending,
  status,
  onSave,
  label = "Save changes",
  children,
}: {
  dirty: boolean;
  pending: boolean;
  status: Status;
  onSave: () => void;
  label?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
      <div className="flex items-center gap-2">{children}</div>
      <div className="flex items-center gap-3">
        {status ? (
          <span
            role="status"
            className={cn(
              "flex max-w-md items-center gap-1.5 text-sm",
              !status.ok ? "text-red-600" : status.warning ? "text-amber-700" : "text-emerald-700",
            )}
          >
            {status.ok && !status.warning && <Check className="size-4 shrink-0" />}
            {status.text}
          </span>
        ) : (
          dirty && <span className="text-sm text-zinc-500">Unsaved changes</span>
        )}
        <button type="button" onClick={onSave} disabled={pending} className={ui.btn}>
          {pending ? "Saving…" : label}
        </button>
      </div>
    </div>
  );
}

/** A full-page form made of cards, saved through a server action. */
export function EntityForm({
  groups,
  initial,
  sources,
  action,
  redirectTo,
  deleteAction,
  deleteRedirect,
  slugFrom,
  submitLabel,
}: {
  groups: { title?: string; description?: string; fields: Field[] }[];
  initial: Value;
  sources?: FieldSources;
  action: SaveAction;
  /** Where to go after creating a record; "{id}" is replaced with the new id. */
  redirectTo?: string;
  deleteAction?: () => Promise<ActionResult>;
  deleteRedirect?: string;
  slugFrom?: string;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState<Value>(initial);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [pending, start] = useTransition();
  useUnsavedWarning(dirty);

  // After a save the page re-renders with fresh data (e.g. ids of newly created
  // rows); adopt it unless the admin has started editing again.
  const [synced, setSynced] = useState(initial);
  if (initial !== synced && !dirty) {
    setSynced(initial);
    setValue(initial);
  }

  const save = () =>
    start(async () => {
      const result = await action(value);
      if (!result.ok) {
        setStatus({ ok: false, text: result.error });
        return;
      }
      setDirty(false);
      setStatus({ ok: true, text: result.message ?? "Saved", warning: result.warning });
      if (redirectTo && result.id && !value.id) {
        router.replace(redirectTo.replace("{id}", result.id));
      } else {
        router.refresh();
      }
    });

  const remove = () => {
    if (!deleteAction || !window.confirm("Delete this permanently? This can't be undone.")) return;
    start(async () => {
      const result = await deleteAction();
      if (!result.ok) {
        setStatus({ ok: false, text: result.error });
        return;
      }
      setDirty(false);
      router.replace(deleteRedirect ?? "/admin");
      router.refresh();
    });
  };

  return (
    <div>
      <div className="space-y-5">
        {groups.map((group, i) => (
          <section key={i} className={ui.card}>
            {group.title && (
              <header className="border-b border-zinc-100 px-5 py-4">
                <h2 className="text-base font-semibold text-zinc-900">{group.title}</h2>
                {group.description && <p className="mt-0.5 text-sm text-zinc-500">{group.description}</p>}
              </header>
            )}
            <div className="p-5">
              <FormFields
                fields={group.fields}
                value={value}
                sources={sources}
                onChange={(next) => {
                  setValue(withAutoSlug(value, next, slugFrom));
                  setDirty(true);
                  setStatus(null);
                }}
              />
            </div>
          </section>
        ))}
      </div>
      <SaveBar dirty={dirty} pending={pending} status={status} onSave={save} label={submitLabel}>
        {deleteAction && (
          <button type="button" onClick={remove} disabled={pending} className={ui.btnDanger}>
            <Trash2 className="size-4" /> Delete
          </button>
        )}
      </SaveBar>
    </div>
  );
}

export type Column = {
  key: string;
  label: string;
  kind?: "text" | "money" | "bool" | "color" | "image" | "number";
};

function Cell({ column, row, money }: { column: Column; row: Value; money: MoneyFormat }) {
  const value = row[column.key];
  switch (column.kind) {
    case "money":
      return <span className="tabular-nums">{formatMoney(Number(value) || 0, money)}</span>;
    case "bool":
      return (
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
            value ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500",
          )}
        >
          {value ? "Yes" : "No"}
        </span>
      );
    case "color":
      return value ? (
        <span className="flex items-center gap-2">
          <span className="size-5 rounded-full border border-black/10" style={{ background: String(value) }} />
          <span className="font-mono text-xs text-zinc-500">{String(value)}</span>
        </span>
      ) : (
        <span className="text-zinc-300">—</span>
      );
    case "image":
      return value ? (
        <img src={String(value)} alt="" className="size-10 rounded-md border border-zinc-200 object-cover" />
      ) : (
        <span className="block size-10 rounded-md bg-zinc-100" />
      );
    default:
      return value === null || value === undefined || value === "" ? (
        <span className="text-zinc-300">—</span>
      ) : (
        <span className={column.kind === "number" ? "tabular-nums" : ""}>{String(value)}</span>
      );
  }
}

/** A list of records with add/edit in a side panel. Used for the simpler catalogues. */
export function CrudTable({
  rows,
  columns,
  fields,
  sources,
  newItem,
  saveAction,
  deleteAction,
  money,
  noun,
  slugFrom,
  tabs,
}: {
  rows: Value[];
  columns: Column[];
  fields: Field[];
  sources?: FieldSources;
  newItem: Value;
  saveAction: SaveAction;
  deleteAction: (id: string) => Promise<ActionResult>;
  money: MoneyFormat;
  /** Singular name of a record, e.g. "collection". */
  noun: string;
  slugFrom?: string;
  /** Splits rows into tabs by the value of `key`. */
  tabs?: { key: string; options: Option[] };
}) {
  const router = useRouter();
  const [tab, setTab] = useState(tabs?.options[0]?.value ?? "");
  const [editing, setEditing] = useState<Value | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [pending, start] = useTransition();

  const visible = tabs ? rows.filter((r) => r[tabs.key] === tab) : rows;
  const close = () => {
    setEditing(null);
    setStatus(null);
  };

  const save = () =>
    start(async () => {
      const result = await saveAction(editing);
      if (!result.ok) {
        setStatus({ ok: false, text: result.error });
        return;
      }
      close();
      router.refresh();
    });

  const remove = (id: string) => {
    if (!window.confirm(`Delete this ${noun}? This can't be undone.`)) return;
    start(async () => {
      const result = await deleteAction(id);
      if (!result.ok) {
        setStatus({ ok: false, text: result.error });
        return;
      }
      close();
      router.refresh();
    });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {tabs ? (
          <div className="flex flex-wrap gap-1 rounded-lg bg-zinc-100 p-1">
            {tabs.options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTab(option.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition",
                  tab === option.value ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900",
                )}
              >
                {option.label}
                <span className="ml-1.5 text-xs text-zinc-400">
                  {rows.filter((r) => r[tabs.key] === option.value).length}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => setEditing(tabs ? { ...newItem, [tabs.key]: tab } : { ...newItem })}
          className={ui.btn}
        >
          <Plus className="size-4" /> Add {noun}
        </button>
      </div>

      {visible.length === 0 ? (
        <div className={cn(ui.card, "px-6 py-12 text-center text-sm text-zinc-500")}>
          Nothing here yet. Add your first {noun}.
        </div>
      ) : (
        <div className={cn(ui.card, "overflow-x-auto")}>
          <table className="w-full min-w-[560px]">
            <thead className="border-b border-zinc-200 bg-zinc-50/60">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className={ui.th}>
                    {c.label}
                  </th>
                ))}
                <th className={ui.th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {visible.map((row) => (
                <tr
                  key={String(row.id)}
                  onClick={() => setEditing(row)}
                  className="cursor-pointer transition hover:bg-zinc-50"
                >
                  {columns.map((c) => (
                    <td key={c.key} className={ui.td}>
                      <Cell column={c} row={row} money={money} />
                    </td>
                  ))}
                  <td className={cn(ui.td, "text-right")}>
                    <Pencil className="inline size-4 text-zinc-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={close}>
          <aside
            role="dialog"
            aria-label={`${editing.id ? "Edit" : "Add"} ${noun}`}
            className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <h2 className="font-semibold capitalize">
                {editing.id ? "Edit" : "Add"} {noun}
              </h2>
              <button type="button" onClick={close} className={ui.btnIcon} aria-label="Close">
                <X className="size-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-5">
              <FormFields
                fields={fields}
                value={editing}
                sources={sources}
                onChange={(next) => {
                  setEditing(withAutoSlug(editing, next, slugFrom));
                  setStatus(null);
                }}
              />
            </div>
            <footer className="flex items-center justify-between gap-3 border-t border-zinc-200 px-5 py-4">
              {editing.id ? (
                <button
                  type="button"
                  onClick={() => remove(String(editing.id))}
                  disabled={pending}
                  className={ui.btnDanger}
                >
                  <Trash2 className="size-4" /> Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-3">
                {status && !status.ok && <span className="max-w-56 text-sm text-red-600">{status.text}</span>}
                <button type="button" onClick={close} className={ui.btnSecondary}>
                  Cancel
                </button>
                <button type="button" onClick={save} disabled={pending} className={ui.btn}>
                  {pending ? "Saving…" : "Save"}
                </button>
              </div>
            </footer>
          </aside>
        </div>
      )}
    </div>
  );
}

/** A button that runs a server action, optionally after a confirmation prompt. */
export function ActionButton({
  action,
  confirm,
  className,
  children,
  title,
}: {
  action: () => Promise<ActionResult>;
  confirm?: string;
  className?: string;
  children: React.ReactNode;
  title?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      title={title}
      disabled={pending}
      className={className ?? ui.btnSecondary}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const result = await action();
          if (!result.ok) window.alert(result.error);
          router.refresh();
        });
      }}
    >
      {children}
    </button>
  );
}
