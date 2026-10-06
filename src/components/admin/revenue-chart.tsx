"use client";

import { useState } from "react";
import { formatMoney, type MoneyFormat } from "@/lib/utils";

export type DayPoint = { day: string; revenue: number; orders: number };

const SERIES = "#2a78d6";

function compact(minor: number, money: MoneyFormat) {
  try {
    return new Intl.NumberFormat(money.locale, {
      style: "currency",
      currency: money.currencyCode,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(minor / 100);
  } catch {
    return formatMoney(minor, money);
  }
}

function label(day: string, locale: string, long = false) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    ...(long && { weekday: "short" }),
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));
}

/** Daily revenue as a single-series bar chart with a per-bar tooltip and a table view. */
export function RevenueChart({ data, money }: { data: DayPoint[]; money: MoneyFormat }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.revenue), 1);
  // Round the axis ceiling up to a tidy number so the gridlines read cleanly.
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const top = Math.ceil(max / magnitude) * magnitude;
  const ticks = [top, top / 2, 0];
  const hasSales = data.some((d) => d.revenue > 0);

  return (
    <div>
      <div className="flex gap-3">
        <div className="flex h-44 w-12 shrink-0 flex-col justify-between text-right text-[11px] text-zinc-500 tabular-nums">
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {compact(t, money)}
            </span>
          ))}
        </div>
        <div className="relative h-44 flex-1">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            {ticks.map((t) => (
              <span key={t} className={`block h-px ${t === 0 ? "bg-zinc-300" : "bg-zinc-100"}`} />
            ))}
          </div>
          <div className="absolute inset-0 flex items-end" role="img" aria-label="Revenue per day">
            {data.map((d, i) => (
              // The whole column is the hover target, so thin bars stay easy to hit.
              <button
                key={d.day}
                type="button"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-label={`${label(d.day, money.locale, true)}: ${formatMoney(d.revenue, money)}, ${d.orders} orders`}
                className="group relative flex h-full flex-1 cursor-default items-end justify-center px-px outline-none"
              >
                <span
                  className="w-full max-w-7 rounded-t transition-opacity group-focus-visible:ring-2 group-focus-visible:ring-zinc-900"
                  style={{
                    height: `${(d.revenue / top) * 100}%`,
                    minHeight: d.revenue > 0 ? 2 : 0,
                    background: SERIES,
                    opacity: active === null || active === i ? 1 : 0.45,
                  }}
                />
                {active === i && (
                  <span
                    className={`pointer-events-none absolute bottom-full z-10 mb-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-xs whitespace-nowrap shadow-lg ${i < 3 ? "left-0" : i > data.length - 4 ? "right-0" : "left-1/2 -translate-x-1/2"}`}
                  >
                    <span className="block text-zinc-500">{label(d.day, money.locale, true)}</span>
                    <span className="block text-sm font-semibold text-zinc-900 tabular-nums">
                      {formatMoney(d.revenue, money)}
                    </span>
                    <span className="block text-zinc-500">
                      {d.orders} order{d.orders === 1 ? "" : "s"}
                    </span>
                  </span>
                )}
              </button>
            ))}
          </div>
          {!hasSales && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
              No sales in this period yet.
            </p>
          )}
        </div>
      </div>
      <div className="mt-2 ml-15 flex justify-between text-[11px] text-zinc-500">
        <span>{label(data[0].day, money.locale)}</span>
        <span>{label(data[Math.floor(data.length / 2)].day, money.locale)}</span>
        <span>{label(data[data.length - 1].day, money.locale)}</span>
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-zinc-500 hover:text-zinc-900">View as table</summary>
        <table className="mt-3 w-full max-w-md text-left">
          <thead>
            <tr className="border-b border-zinc-200 text-xs text-zinc-500">
              <th className="py-1.5 font-medium">Day</th>
              <th className="py-1.5 text-right font-medium">Orders</th>
              <th className="py-1.5 text-right font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {data.map((d) => (
              <tr key={d.day} className="border-b border-zinc-100">
                <td className="py-1.5">{label(d.day, money.locale, true)}</td>
                <td className="py-1.5 text-right">{d.orders}</td>
                <td className="py-1.5 text-right">{formatMoney(d.revenue, money)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
