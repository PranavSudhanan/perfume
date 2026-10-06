import Link from "next/link";
import { cn } from "@/lib/utils";

/** Admin styling is deliberately independent of the storefront theme. */
export const ui = {
  btn: "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50",
  btnSecondary:
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50",
  btnDanger:
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50",
  btnIcon:
    "inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30",
  input:
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10",
  label: "mb-1.5 block text-sm font-medium text-zinc-700",
  help: "mt-1.5 text-xs text-zinc-500",
  card: "rounded-xl border border-zinc-200 bg-white",
  th: "px-4 py-3 text-left text-xs font-medium tracking-wide text-zinc-500 uppercase",
  td: "px-4 py-3 text-sm text-zinc-700",
};

export function PageHeader({
  title,
  description,
  children,
  back,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && (
          <Link href={back.href} className="mb-1 inline-block text-sm text-zinc-500 hover:text-zinc-900">
            ← {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({
  title,
  description,
  children,
  className,
  actions,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className={cn(ui.card, className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-zinc-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
          </div>
          {actions && <div className="shrink-0 whitespace-nowrap">{actions}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const TONES = {
  neutral: "bg-zinc-100 text-zinc-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-sky-50 text-sky-700",
  violet: "bg-violet-50 text-violet-700",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize", TONES[tone])}>
      {children}
    </span>
  );
}

export const ORDER_TONE: Record<string, keyof typeof TONES> = {
  pending: "amber",
  confirmed: "blue",
  processing: "violet",
  shipped: "blue",
  delivered: "green",
  cancelled: "red",
};

export const PAYMENT_TONE: Record<string, keyof typeof TONES> = {
  pending: "amber",
  paid: "green",
  failed: "red",
  refunded: "neutral",
};

export function EmptyState({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className={cn(ui.card, "px-6 py-14 text-center")}>
      <p className="font-medium text-zinc-900">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">{text}</p>}
      {children && <div className="mt-5 flex justify-center gap-2">{children}</div>}
    </div>
  );
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className={cn(ui.card, "overflow-x-auto")}>
      <table className="w-full min-w-[640px]">
        <thead className="border-b border-zinc-200 bg-zinc-50/60">
          <tr>
            {head.map((h, i) => (
              <th key={i} className={ui.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">{children}</tbody>
      </table>
    </div>
  );
}
