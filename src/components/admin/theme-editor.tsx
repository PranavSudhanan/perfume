"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { saveSettingsAction } from "@/lib/actions/admin";
import {
  FONT_NAMES,
  fontsHref,
  THEME_PRESETS,
  themeVars,
  type ThemeColors,
  type ThemeSettings,
} from "@/lib/theme";
import { cn } from "@/lib/utils";
import { SaveBar } from "./crud";
import { Toggle } from "./fields";
import { ui } from "./ui";

const COLOR_FIELDS: { key: keyof ThemeColors; label: string; help: string }[] = [
  { key: "background", label: "Background", help: "Page background" },
  { key: "surface", label: "Surface", help: "Cards and soft sections" },
  { key: "text", label: "Text", help: "Headings and body text" },
  { key: "muted", label: "Muted text", help: "Secondary text" },
  { key: "primary", label: "Primary", help: "Buttons" },
  { key: "primaryText", label: "On primary", help: "Text on buttons" },
  { key: "accent", label: "Accent", help: "Eyebrows, stars, highlights" },
  { key: "border", label: "Lines", help: "Borders and dividers" },
];

type Choice<T extends string> = { value: T; label: string };

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Choice<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className={ui.label}>{label}</p>
      <div className="flex flex-wrap gap-1 rounded-lg bg-zinc-100 p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition",
              value === option.value ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** WCAG contrast ratio between two hex colours. */
function contrast(a: string, b: string) {
  const luminance = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, bl] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const HEX = /^#[0-9a-f]{6}$/i;

export function ThemeEditor({ initial, storeName }: { initial: ThemeSettings; storeName: string }) {
  const router = useRouter();
  const [theme, setTheme] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const change = (changes: Partial<ThemeSettings>) => {
    setTheme({ ...theme, ...changes });
    setDirty(true);
    setStatus(null);
  };
  const setColor = (key: keyof ThemeColors, value: string) =>
    change({ preset: "custom", colors: { ...theme.colors, [key]: value } });

  const save = () =>
    start(async () => {
      const result = await saveSettingsAction("theme", theme);
      if (!result.ok) {
        setStatus({ ok: false, text: result.error });
        return;
      }
      setDirty(false);
      setStatus({ ok: true, text: "Saved — your storefront is updated" });
      router.refresh();
    });

  const colorsValid = Object.values(theme.colors).every((c) => HEX.test(c));
  const warnings = colorsValid
    ? [
        contrast(theme.colors.text, theme.colors.background) < 4.5 &&
          "Text is hard to read on the background — choose colours with more contrast.",
        contrast(theme.colors.primaryText, theme.colors.primary) < 4.5 &&
          "Button text is hard to read on the primary colour.",
        contrast(theme.colors.muted, theme.colors.background) < 3 &&
          "Muted text is very faint on the background.",
      ].filter((w): w is string => !!w)
    : ["One of the colours is not a valid 6-digit hex value (like #a07a35)."];

  return (
    <div>
      {/* Loads whichever fonts are selected so the preview is accurate. */}
      <link rel="stylesheet" href={fontsHref(theme)} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <section className={ui.card}>
            <header className="border-b border-zinc-100 px-5 py-4">
              <h2 className="text-base font-semibold">Start from a preset</h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                One click sets colours and fonts. Fine-tune anything below afterwards.
              </p>
            </header>
            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
              {Object.entries(THEME_PRESETS).map(([key, preset]) => {
                const selected = theme.preset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      change({
                        preset: key,
                        colors: { ...preset.colors },
                        headingFont: preset.headingFont,
                        bodyFont: preset.bodyFont,
                      })
                    }
                    aria-pressed={selected}
                    className={cn(
                      "relative overflow-hidden rounded-lg border text-left transition",
                      selected ? "border-zinc-900 ring-2 ring-zinc-900" : "border-zinc-200 hover:border-zinc-400",
                    )}
                  >
                    <span className="flex h-14" style={{ background: preset.colors.background }}>
                      <span className="flex-1" />
                      <span className="w-1/5" style={{ background: preset.colors.surface }} />
                      <span className="w-1/5" style={{ background: preset.colors.accent }} />
                      <span className="w-1/5" style={{ background: preset.colors.primary }} />
                    </span>
                    <span className="block border-t border-zinc-200 bg-white px-3 py-2">
                      <span className="block text-sm font-medium text-zinc-900">{preset.label}</span>
                      <span className="block truncate text-xs text-zinc-500">
                        {preset.headingFont} · {preset.bodyFont}
                      </span>
                    </span>
                    {selected && (
                      <span className="absolute top-2 left-2 flex size-5 items-center justify-center rounded-full bg-zinc-900 text-white">
                        <Check className="size-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className={ui.card}>
            <header className="border-b border-zinc-100 px-5 py-4">
              <h2 className="text-base font-semibold">Colours</h2>
            </header>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {COLOR_FIELDS.map((field) => {
                const value = theme.colors[field.key];
                return (
                  <label key={field.key} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={HEX.test(value) ? value : "#000000"}
                      onChange={(e) => setColor(field.key, e.target.value)}
                      className="size-10 shrink-0 cursor-pointer rounded-lg border border-zinc-300 bg-white p-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-zinc-800">{field.label}</span>
                      <span className="block text-xs text-zinc-500">{field.help}</span>
                    </span>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setColor(field.key, e.target.value.trim())}
                      aria-label={`${field.label} hex value`}
                      className={cn(ui.input, "w-24 font-mono text-xs")}
                    />
                  </label>
                );
              })}
            </div>
            {warnings.length > 0 && (
              <ul className="mx-5 mb-5 space-y-1 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
          </section>

          <section className={ui.card}>
            <header className="border-b border-zinc-100 px-5 py-4">
              <h2 className="text-base font-semibold">Typography</h2>
            </header>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {(["headingFont", "bodyFont"] as const).map((key) => (
                <label key={key} className="block">
                  <span className={ui.label}>{key === "headingFont" ? "Heading font" : "Body font"}</span>
                  <select
                    value={theme[key]}
                    onChange={(e) => change({ [key]: e.target.value, preset: "custom" })}
                    className={cn(ui.input, "cursor-pointer")}
                  >
                    {FONT_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <div className="sm:col-span-2">
                <Segmented
                  label="Heading style"
                  value={theme.headingCase}
                  onChange={(headingCase) => change({ headingCase })}
                  options={[
                    { value: "normal", label: "Sentence case" },
                    { value: "uppercase", label: "UPPERCASE" },
                  ]}
                />
              </div>
            </div>
          </section>

          <section className={ui.card}>
            <header className="border-b border-zinc-100 px-5 py-4">
              <h2 className="text-base font-semibold">Shape & layout</h2>
            </header>
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <Segmented
                label="Corners"
                value={theme.radius}
                onChange={(radius) => change({ radius })}
                options={[
                  { value: "none", label: "Square" },
                  { value: "soft", label: "Soft" },
                  { value: "round", label: "Round" },
                  { value: "pill", label: "Pill" },
                ]}
              />
              <Segmented
                label="Buttons"
                value={theme.buttonStyle}
                onChange={(buttonStyle) => change({ buttonStyle })}
                options={[
                  { value: "solid", label: "Filled" },
                  { value: "outline", label: "Outlined" },
                ]}
              />
              <Segmented
                label="Page width"
                value={theme.containerWidth}
                onChange={(containerWidth) => change({ containerWidth })}
                options={[
                  { value: "narrow", label: "Narrow" },
                  { value: "normal", label: "Normal" },
                  { value: "wide", label: "Wide" },
                ]}
              />
              <Segmented
                label="Header layout"
                value={theme.headerLayout}
                onChange={(headerLayout) => change({ headerLayout })}
                options={[
                  { value: "left", label: "Logo left" },
                  { value: "center", label: "Logo centred" },
                ]}
              />
              <Segmented
                label="Product cards"
                value={theme.cardStyle}
                onChange={(cardStyle) => change({ cardStyle })}
                options={[
                  { value: "plain", label: "Plain" },
                  { value: "boxed", label: "Boxed" },
                ]}
              />
              <Segmented
                label="Product image shape"
                value={theme.imageRatio}
                onChange={(imageRatio) => change({ imageRatio })}
                options={[
                  { value: "square", label: "Square" },
                  { value: "portrait", label: "Portrait" },
                  { value: "tall", label: "Tall" },
                ]}
              />
              <div className="sm:col-span-2">
                <Toggle
                  label="Keep the header visible while scrolling"
                  checked={theme.headerSticky}
                  onChange={(headerSticky) => change({ headerSticky })}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Live preview: the same CSS variables the storefront uses, scoped to this box. */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          <p className="mb-2 text-xs font-medium tracking-wider text-zinc-400 uppercase">Live preview</p>
          <div
            className="theme-scope store overflow-hidden rounded-xl border border-zinc-200 shadow-sm"
            style={themeVars(theme) as React.CSSProperties}
            data-btn={theme.buttonStyle}
            data-card={theme.cardStyle}
          >
            <div className="tone-dark bg-bg text-ink py-2 text-center text-[0.6rem] tracking-[0.18em] uppercase">
              Complimentary shipping on all orders
            </div>
            <div
              className={cn(
                "border-line flex items-center border-b px-5 py-4",
                theme.headerLayout === "center" ? "justify-center" : "justify-between",
              )}
            >
              <span className="heading text-xl tracking-[0.18em] uppercase">{storeName}</span>
              {theme.headerLayout === "left" && (
                <span className="text-[0.65rem] tracking-[0.14em] uppercase">Shop · Create · Story</span>
              )}
            </div>
            <div className="px-5 py-8">
              <p className="eyebrow mb-2">Bespoke perfumery</p>
              <h3 className="heading text-4xl">A perfume composed only for you</h3>
              <p className="text-muted mt-3 text-sm leading-relaxed">
                Choose your notes, name your bottle and we blend it by hand in our atelier.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="btn btn-primary btn-sm">Create yours</span>
                <span className="btn btn-outline btn-sm">Shop all</span>
              </div>
            </div>
            <div className="tone-surface bg-bg grid grid-cols-2 gap-4 px-5 py-6">
              {["Noor", "Rosa Nocturne"].map((name, i) => (
                <div key={name} className="product-card">
                  <div
                    className="card-media rounded-theme"
                    style={{
                      background: `linear-gradient(160deg, ${theme.colors.border}, ${i ? theme.colors.accent : theme.colors.muted})`,
                    }}
                  />
                  <p className="text-muted mt-3 text-[0.6rem] tracking-[0.2em] uppercase">Amber</p>
                  <p className="heading text-lg">{name}</p>
                  <p className="text-sm">From ₹1,590</p>
                </div>
              ))}
            </div>
            <div className="px-5 py-6">
              <input readOnly value="you@example.com" className="field" aria-label="Sample input" />
            </div>
            <div className="tone-dark bg-bg text-ink px-5 py-5">
              <p className="heading text-lg tracking-[0.18em] uppercase">{storeName}</p>
              <p className="text-muted mt-1 text-xs">Footer text and links appear like this.</p>
            </div>
          </div>
        </div>
      </div>

      <SaveBar dirty={dirty} pending={pending} status={status} onSave={save} label="Publish theme">
        {dirty && (
          <button
            type="button"
            onClick={() => {
              setTheme(initial);
              setDirty(false);
              setStatus(null);
            }}
            className={ui.btnSecondary}
          >
            Discard changes
          </button>
        )}
      </SaveBar>
    </div>
  );
}
