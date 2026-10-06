"use client";

import { Check, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { cart } from "@/lib/cart";
import { blendColors } from "@/lib/color";
import type { BuilderSettings, BuilderStep } from "@/lib/config";
import type { BuilderChoice } from "@/lib/data";
import { Bottle } from "./bottle";
import { QtyStepper } from "./cart-drawer";
import { useMoney } from "./store-context";

type Selections = Record<string, string[]>;

function hash(text: string) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function rule(step: BuilderStep) {
  if (step.min === step.max) return `Choose ${step.min}`;
  if (step.min === 0) return `Optional · up to ${step.max}`;
  return `Choose ${step.min}–${step.max}`;
}

export function PerfumeBuilder({
  builder,
  choices,
}: {
  builder: BuilderSettings;
  choices: BuilderChoice[];
}) {
  const money = useMoney();
  // Only steps that actually have options are shown.
  const steps = useMemo(
    () => builder.steps.filter((s) => choices.some((c) => c.step === s.key)),
    [builder.steps, choices],
  );
  const byId = useMemo(() => new Map(choices.map((c) => [c.id, c])), [choices]);
  const personalise = builder.labelEnabled || builder.giftMessageEnabled;
  const lastIndex = steps.length + (personalise ? 0 : -1);

  const [selections, setSelections] = useState<Selections>({});
  const [active, setActive] = useState(0);
  const [labelText, setLabelText] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const chosen = (step: BuilderStep) =>
    (selections[step.key] ?? []).map((id) => byId.get(id)).filter((c): c is BuilderChoice => !!c);
  const complete = (step: BuilderStep) => {
    const n = chosen(step).length;
    return n >= step.min && n <= step.max;
  };

  const picked = steps.flatMap(chosen);
  const label = builder.labelEnabled ? labelText.trim() : "";
  const price =
    builder.basePrice +
    picked.reduce((sum, c) => sum + c.priceDelta, 0) +
    (label ? builder.labelPrice : 0);
  const liquid = blendColors(picked.map((c) => c.color));
  const missing = steps.filter((s) => !complete(s));
  const ready = missing.length === 0;

  const families = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of picked) if (c.family) counts.set(c.family, (counts.get(c.family) ?? 0) + 1);
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([family, n]) => ({ family, share: Math.round((n / total) * 100) }));
    // `picked` is derived from selections, which is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections, byId]);

  function toggle(step: BuilderStep, id: string) {
    setAdded(false);
    setSelections((current) => {
      const existing = current[step.key] ?? [];
      if (existing.includes(id)) {
        return { ...current, [step.key]: existing.filter((x) => x !== id) };
      }
      // Single-choice steps swap; multi-choice steps drop the oldest pick when full.
      const next = step.max === 1 ? [id] : [...existing, id].slice(-step.max);
      return { ...current, [step.key]: next };
    });
  }

  function addToBag() {
    if (!ready) {
      setActive(steps.indexOf(missing[0]));
      return;
    }
    const gift = builder.giftMessageEnabled ? giftMessage.trim() : "";
    const clean: Selections = Object.fromEntries(steps.map((s) => [s.key, chosen(s).map((c) => c.id)]));
    cart.add({
      key: `c:${hash(JSON.stringify([clean, label, gift]))}`,
      kind: "custom",
      qty,
      name: label ? `${builder.productName} — “${label}”` : builder.productName,
      variantLabel: chosen(steps.find((s) => s.key === "size") ?? steps[0])[0]?.name ?? null,
      image: null,
      slug: null,
      unitPrice: price,
      selections: clean,
      summary: steps.map((s) => ({ title: s.title, options: chosen(s).map((c) => c.name) })),
      labelText: label || undefined,
      giftMessage: gift || undefined,
      liquidColor: liquid,
    });
    setAdded(true);
  }

  if (!steps.length) {
    return <p className="text-muted py-20 text-center">The perfume builder has no options yet.</p>;
  }

  const summary = (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-muted text-xs tracking-widest uppercase">Your blend</p>
          <p className="text-3xl tabular-nums">{money(price * qty)}</p>
        </div>
        <QtyStepper qty={qty} onChange={(q) => setQty(Math.max(1, q))} />
      </div>
      <button type="button" onClick={addToBag} className="btn btn-primary mt-5 w-full">
        {added ? (
          <>
            <Check className="size-4" /> Added to bag
          </>
        ) : ready ? (
          "Add to bag"
        ) : (
          `Next: ${missing[0].title}`
        )}
      </button>
      {builder.leadTime && <p className="text-muted mt-3 text-center text-xs">{builder.leadTime}</p>}
    </div>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      {/* Live preview */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="tone-surface bg-bg rounded-theme relative overflow-hidden px-6 pt-8 pb-6">
          <div
            className="absolute top-1/2 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl transition-colors duration-500"
            style={{ background: liquid }}
          />
          <Bottle color={liquid} label={label} className="relative mx-auto h-64 w-auto md:h-96" />
          <div className="relative mt-6 text-center">
            <p className="heading text-3xl">{label || builder.productName}</p>
            {families.length > 0 ? (
              <div className="mt-4">
                <div className="mx-auto flex h-1.5 max-w-xs overflow-hidden rounded-full">
                  {families.map((f, i) => (
                    <span
                      key={f.family}
                      className="bg-ink h-full transition-all duration-500"
                      style={{ width: `${f.share}%`, opacity: 1 - i * 0.2 }}
                    />
                  ))}
                </div>
                <p className="text-muted mt-3 text-xs tracking-widest uppercase">
                  {families.map((f) => `${f.family} ${f.share}%`).join(" · ")}
                </p>
              </div>
            ) : (
              <p className="text-muted mt-3 text-sm">Your scent profile appears as you choose notes.</p>
            )}
          </div>
        </div>

        <div className="mt-6 hidden lg:block">
          {summary}
        </div>
      </div>

      {/* Steps */}
      <div>
        <ol className="border-line divide-line divide-y border-y">
          {steps.map((step, index) => {
            const open = active === index;
            const picks = chosen(step);
            const done = complete(step) && picks.length > 0;
            const options = choices.filter((c) => c.step === step.key);
            const allPriced = options.every((o) => o.priceDelta > 0);
            return (
              <li key={step.key}>
                <button
                  type="button"
                  onClick={() => setActive(open ? -1 : index)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-4 py-5 text-left"
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full border text-sm transition ${done ? "border-ink bg-ink text-bg" : "border-line"}`}
                  >
                    {done ? <Check className="size-4" /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="heading block text-2xl">{step.title}</span>
                    <span className="text-muted block truncate text-sm">
                      {picks.length ? picks.map((p) => p.name).join(", ") : rule(step)}
                    </span>
                  </span>
                  <ChevronDown
                    className={`size-5 shrink-0 transition ${open ? "rotate-180" : ""}`}
                    strokeWidth={1.5}
                  />
                </button>

                {open && (
                  <div className="animate-fade-up pb-7">
                    <p className="text-muted mb-5 text-sm">
                      {step.subtitle} <span className="opacity-70">({rule(step)})</span>
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {options.map((option) => {
                        const selected = picks.some((p) => p.id === option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => toggle(step, option.id)}
                            aria-pressed={selected}
                            className={`rounded-theme flex items-start gap-3 border p-4 text-left transition ${selected ? "border-ink bg-surface" : "border-line hover:border-ink/50"}`}
                          >
                            {option.image ? (
                              <img src={option.image} alt="" className="size-10 shrink-0 rounded-full object-cover" />
                            ) : option.color ? (
                              <span
                                className="mt-0.5 size-8 shrink-0 rounded-full border border-black/10"
                                style={{ background: option.color }}
                              />
                            ) : null}
                            <span className="min-w-0 flex-1">
                              <span className="flex items-baseline justify-between gap-3">
                                <span className="font-medium">{option.name}</span>
                                <span className="text-muted shrink-0 text-xs tabular-nums">
                                  {option.priceDelta > 0
                                    ? `${allPriced ? "" : "+"}${money(option.priceDelta)}`
                                    : "Included"}
                                </span>
                              </span>
                              {option.description && (
                                <span className="text-muted mt-0.5 block text-sm leading-snug">
                                  {option.description}
                                </span>
                              )}
                              {option.family && (
                                <span className="text-accent mt-1.5 block text-[0.65rem] tracking-[0.18em] uppercase">
                                  {option.family}
                                </span>
                              )}
                            </span>
                            <span
                              className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-ink bg-ink text-bg" : "border-line"}`}
                            >
                              {selected && <Check className="size-3" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {index < lastIndex && (
                      <button
                        type="button"
                        onClick={() => setActive(index + 1)}
                        disabled={!complete(step)}
                        className="btn btn-outline btn-sm mt-6"
                      >
                        Continue
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}

          {personalise && (
            <li>
              <button
                type="button"
                onClick={() => setActive(active === steps.length ? -1 : steps.length)}
                aria-expanded={active === steps.length}
                className="flex w-full items-center gap-4 py-5 text-left"
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full border text-sm ${label ? "border-ink bg-ink text-bg" : "border-line"}`}
                >
                  {label ? <Check className="size-4" /> : steps.length + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="heading block text-2xl">Make it yours</span>
                  <span className="text-muted block truncate text-sm">
                    {label ? `Label: “${label}”` : "Name your perfume · optional"}
                  </span>
                </span>
                <ChevronDown
                  className={`size-5 shrink-0 transition ${active === steps.length ? "rotate-180" : ""}`}
                  strokeWidth={1.5}
                />
              </button>
              {active === steps.length && (
                <div className="animate-fade-up space-y-5 pb-7">
                  {builder.labelEnabled && (
                    <label className="block">
                      <span className="field-label">
                        Name on the label
                        {builder.labelPrice > 0 && ` (+${money(builder.labelPrice)})`}
                      </span>
                      <input
                        value={labelText}
                        onChange={(e) => {
                          setLabelText(e.target.value.slice(0, builder.labelMaxChars));
                          setAdded(false);
                        }}
                        maxLength={builder.labelMaxChars}
                        placeholder="e.g. Midnight in Jaipur"
                        className="field"
                      />
                      <span className="text-muted mt-1.5 block text-xs">
                        {labelText.length}/{builder.labelMaxChars} characters — printed on your bottle.
                      </span>
                    </label>
                  )}
                  {builder.giftMessageEnabled && (
                    <label className="block">
                      <span className="field-label">Gift message (optional)</span>
                      <textarea
                        value={giftMessage}
                        onChange={(e) => {
                          setGiftMessage(e.target.value.slice(0, 300));
                          setAdded(false);
                        }}
                        rows={3}
                        placeholder="We’ll include a handwritten card with your words."
                        className="field resize-y"
                      />
                    </label>
                  )}
                </div>
              )}
            </li>
          )}
        </ol>

        <div className="mt-8 lg:hidden">
          {summary}
        </div>
      </div>
    </div>
  );
}
