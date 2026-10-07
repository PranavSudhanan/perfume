"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Country } from "@/lib/geo";

type GeoData = { states: { name: string; cities: string[] }[] };

const EMPTY: GeoData = { states: [] };
const cache = new Map<string, Promise<GeoData>>();

/** States and cities for one country, fetched once per visit from public/geo. */
function loadGeo(code: string): Promise<GeoData> {
  let pending = cache.get(code);
  if (!pending) {
    pending = fetch(`/geo/${encodeURIComponent(code)}.json`)
      .then((response) => (response.ok ? (response.json() as Promise<GeoData>) : EMPTY))
      .catch(() => {
        // Don't remember a network failure — let the next attempt retry.
        cache.delete(code);
        return EMPTY;
      });
    cache.set(code, pending);
  }
  return pending;
}

const MAX_SHOWN = 200;
const chevron = "text-muted pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2";

/**
 * A dropdown with a search box, for long lists. With `allowCustom`, a customer
 * whose city isn't listed can type it and choose "Use …" instead of being stuck.
 */
function SearchSelect({
  name,
  value,
  onChange,
  options,
  placeholder,
  required,
  allowCustom,
  autoComplete,
  labelId,
}: {
  /** Id of the element holding the field's visible label. */
  labelId: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
  allowCustom?: boolean;
  autoComplete?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const listId = useId();
  const triggerId = useId();

  const q = query.trim().toLowerCase();
  const { shown, hidden, custom } = useMemo(() => {
    const matches = q
      ? [
          ...options.filter((o) => o.toLowerCase().startsWith(q)),
          ...options.filter((o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q)),
        ]
      : options;
    const exact = options.some((o) => o.toLowerCase() === q);
    return {
      shown: matches.slice(0, MAX_SHOWN),
      hidden: Math.max(0, matches.length - MAX_SHOWN),
      custom: allowCustom && q && !exact ? query.trim() : "",
    };
  }, [options, q, query, allowCustom]);
  const rows = custom ? [...shown, custom] : shown;

  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const onPointerDown = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);

  const openList = () => {
    setQuery("");
    setActive(Math.max(0, options.indexOf(value)));
    setOpen(true);
  };
  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
    trigger.current?.focus();
  };

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        id={triggerId}
        type="button"
        role="combobox"
        aria-labelledby={`${labelId} ${triggerId}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openList();
          }
        }}
        className="field relative pr-10 text-left"
      >
        <span className={value ? "" : "text-muted/70"}>{value || placeholder}</span>
        <ChevronDown className={chevron} strokeWidth={1.5} />
      </button>

      {/* Carries the value in the form, lets the browser flag the field when it is
          required and empty, and receives browser autofill. */}
      <input
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        autoComplete={autoComplete}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-full opacity-0"
      />

      {open && (
        <div className="border-line bg-bg rounded-theme absolute inset-x-0 top-full z-30 mt-1 overflow-hidden border shadow-xl">
          <div className="border-line relative border-b">
            <Search className="text-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" strokeWidth={1.5} />
            <input
              ref={search}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActive((i) => Math.min(rows.length - 1, i + 1));
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((i) => Math.max(0, i - 1));
                } else if (event.key === "Enter") {
                  // Never let Enter submit the surrounding form from inside the dropdown.
                  event.preventDefault();
                  if (rows[active]) choose(rows[active]);
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  setOpen(false);
                  trigger.current?.focus();
                } else if (event.key === "Tab") {
                  setOpen(false);
                }
              }}
              placeholder="Type to search…"
              aria-label="Search"
              aria-controls={listId}
              aria-activedescendant={rows.length ? `${listId}-${active}` : undefined}
              autoComplete="off"
              className="placeholder:text-muted/70 w-full bg-transparent py-3 pr-4 pl-10 text-sm outline-none"
            />
          </div>
          <ul id={listId} role="listbox" className="max-h-60 overflow-y-auto py-1 text-sm">
            {rows.map((row, index) => {
              const isCustom = row === custom && index === rows.length - 1 && !!custom;
              return (
                <li
                  key={isCustom ? "__custom" : row}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={row === value}
                  onMouseEnter={() => setActive(index)}
                  // mousedown (not click) so the choice lands before the search box loses focus
                  onMouseDown={(event) => {
                    event.preventDefault();
                    choose(row);
                  }}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2 ${index === active ? "bg-surface" : ""}`}
                >
                  <span>{isCustom ? `Use “${row}”` : row}</span>
                  {row === value && !isCustom && <Check className="size-4 shrink-0" strokeWidth={1.5} />}
                </li>
              );
            })}
            {rows.length === 0 && <li className="text-muted px-4 py-3">No matches.</li>}
            {hidden > 0 && (
              <li className="text-muted px-4 py-2 text-xs">{hidden} more — keep typing to narrow the list.</li>
            )}
          </ul>
          {allowCustom && !custom && (
            <p className="border-line text-muted border-t px-4 py-2 text-xs">
              Can’t find yours? Type it and choose it from the list.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Country, state and city as linked dropdowns. They submit plain names under
 * the form field names `country`, `state` and `city`.
 */
export function RegionFields({
  countries,
  defaults,
  required = false,
}: {
  /** The countries offered; the first is preselected. */
  countries: Country[];
  defaults?: { country?: string; state?: string; city?: string } | null;
  required?: boolean;
}) {
  const saved = countries.find((c) => c.name === defaults?.country);
  const [country, setCountry] = useState(saved ?? countries[0]);
  // A saved state and city only make sense if the saved country is still offered.
  const [state, setState] = useState(saved ? (defaults?.state ?? "") : "");
  const [city, setCity] = useState(saved ? (defaults?.city ?? "") : "");
  const [loaded, setLoaded] = useState<{ code: string; data: GeoData } | null>(null);
  const cityLabelId = useId();

  useEffect(() => {
    let cancelled = false;
    loadGeo(country.code).then((data) => {
      if (!cancelled) setLoaded({ code: country.code, data });
    });
    return () => {
      cancelled = true;
    };
  }, [country.code]);

  const data = loaded?.code === country.code ? loaded.data : null;
  const loading = !data;
  const states = data?.states ?? [];
  const knownState = states.find((s) => s.name === state);
  const cities = knownState?.cities ?? [];

  return (
    <>
      <label className="block">
        <span className="field-label">Country</span>
        <span className="relative block">
          <select
            name="country"
            required={required}
            value={country.name}
            autoComplete="country-name"
            onChange={(event) => {
              const next = countries.find((c) => c.name === event.target.value);
              if (!next) return;
              setCountry(next);
              setState("");
              setCity("");
            }}
            className="field cursor-pointer appearance-none pr-10"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className={chevron} strokeWidth={1.5} />
        </span>
      </label>

      <label className="block">
        <span className="field-label">State</span>
        {loading || states.length > 0 ? (
          <span className="relative block">
            <select
              name="state"
              required={required}
              disabled={loading}
              // A saved state that isn't in the list (old free-text entry) has to be picked again.
              value={knownState ? state : ""}
              autoComplete="address-level1"
              onChange={(event) => {
                setState(event.target.value);
                setCity("");
              }}
              className="field cursor-pointer appearance-none pr-10 disabled:cursor-wait"
            >
              <option value="">{loading ? "Loading…" : "Select state"}</option>
              {states.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className={chevron} strokeWidth={1.5} />
          </span>
        ) : (
          // No list for this country: fall back to typing.
          <input
            name="state"
            required={required}
            value={state}
            onChange={(event) => setState(event.target.value)}
            autoComplete="address-level1"
            className="field"
          />
        )}
      </label>

      {/* Not a <label>: the control is a button + popup, labelled through aria instead. */}
      <div>
        <span id={cityLabelId} className="field-label">
          City
        </span>
        {loading || (states.length > 0 && !knownState) ? (
          <>
            <button type="button" disabled className="field text-muted/70 relative cursor-not-allowed pr-10 text-left">
              {loading ? "Loading…" : "Select a state first"}
              <ChevronDown className={chevron} strokeWidth={1.5} />
            </button>
            <input type="hidden" name="city" value="" />
          </>
        ) : cities.length > 0 ? (
          <SearchSelect
            labelId={cityLabelId}
            name="city"
            value={city}
            onChange={setCity}
            options={cities}
            placeholder="Select city"
            required={required}
            allowCustom
            autoComplete="address-level2"
          />
        ) : (
          <input
            name="city"
            required={required}
            value={city}
            onChange={(event) => setCity(event.target.value)}
            autoComplete="address-level2"
            aria-label="City"
            className="field"
          />
        )}
      </div>
    </>
  );
}
