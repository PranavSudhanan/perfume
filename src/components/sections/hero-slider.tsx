"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { safeHref } from "@/lib/utils";

export type HeroSlide = {
  image?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

const HEIGHT = {
  medium: "min-h-[440px] h-[60vh]",
  tall: "min-h-[520px] h-[78vh]",
  full: "min-h-[560px] h-[calc(100dvh-5rem)]",
};

const OVERLAY = { none: 0, light: 0.18, medium: 0.36, strong: 0.55 };

export function HeroSlider({
  slides,
  height,
  align,
  tone,
  overlay,
  autoplay,
}: {
  slides: HeroSlide[];
  height: keyof typeof HEIGHT;
  align: "left" | "center";
  tone: "light" | "dark";
  overlay: keyof typeof OVERLAY;
  autoplay: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (!autoplay || paused || count < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 6500);
    return () => clearInterval(timer);
  }, [autoplay, paused, count]);

  if (!count) return null;
  const shade = tone === "light" ? "0 0 0" : "255 255 255";
  // A soft shadow keeps light text readable wherever it lands on a photograph.
  const legible = tone === "light" ? "[text-shadow:0_1px_14px_rgb(0_0_0/0.5)]" : "";
  const active = index % count;

  return (
    <section
      className={`relative overflow-hidden ${HEIGHT[height] ?? HEIGHT.tall} ${tone === "light" ? "tone-image-light bg-black" : "tone-image-dark bg-white"}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === active ? "opacity-100" : "pointer-events-none opacity-0"}`}
          aria-hidden={i !== active}
        >
          {slide.image && (
            <img
              src={slide.image}
              alt=""
              fetchPriority={i === 0 ? "high" : "auto"}
              loading={i === 0 ? "eager" : "lazy"}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div
            className="absolute inset-0"
            style={{ background: `rgb(${shade} / ${OVERLAY[overlay] ?? OVERLAY.medium})` }}
          />
          <div className="container-page text-ink relative flex h-full items-center">
            <div
              key={i === active ? `on-${i}` : `off-${i}`}
              className={`max-w-xl ${i === active ? "animate-fade-up" : ""} ${align === "center" ? "mx-auto text-center" : ""}`}
            >
              {slide.eyebrow && <p className={`eyebrow mb-5 ${legible}`}>{slide.eyebrow}</p>}
              {slide.title && <h2 className={`heading text-5xl md:text-7xl ${legible}`}>{slide.title}</h2>}
              {slide.subtitle && (
                <p className={`text-muted mt-6 text-base leading-relaxed md:text-lg ${legible}`}>{slide.subtitle}</p>
              )}
              <div className={`mt-9 flex flex-wrap gap-3 ${align === "center" ? "justify-center" : ""}`}>
                {slide.primaryLabel && (
                  <Link href={safeHref(slide.primaryHref, "/shop")} className="btn btn-primary" tabIndex={i === active ? 0 : -1}>
                    {slide.primaryLabel}
                  </Link>
                )}
                {slide.secondaryLabel && (
                  <Link href={safeHref(slide.secondaryHref, "/shop")} className="btn btn-outline" tabIndex={i === active ? 0 : -1}>
                    {slide.secondaryLabel}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {count > 1 && (
        <div className="container-page text-ink absolute inset-x-0 bottom-6 flex items-center justify-between">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === active}
                className={`h-[3px] transition-all ${i === active ? "bg-ink w-10" : "bg-ink/40 w-5"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIndex((active - 1 + count) % count)}
              aria-label="Previous slide"
              className="border-line hover:bg-ink/10 rounded-full border p-2 transition"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((active + 1) % count)}
              aria-label="Next slide"
              className="border-line hover:bg-ink/10 rounded-full border p-2 transition"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
