import {
  Award,
  ChevronDown,
  Clock,
  Droplet,
  Feather,
  FlaskConical,
  Gem,
  Gift,
  Heart,
  Leaf,
  Mail,
  MapPin,
  Package,
  Phone,
  Recycle,
  ShieldCheck,
  Sparkles,
  Truck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { SectionData } from "@/db/schema";
import { ContactForm, NewsletterForm } from "@/components/store/forms";
import { Markdown } from "@/components/store/markdown";
import { ProductGrid } from "@/components/store/product-card";
import { getCatalog, getCategories, getSettings } from "@/lib/data";
import { safeHref } from "@/lib/utils";
import { HeroSlider, type HeroSlide } from "./hero-slider";

type Props = Record<string, unknown>;

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  leaf: Leaf,
  droplet: Droplet,
  flask: FlaskConical,
  gift: Gift,
  truck: Truck,
  shield: ShieldCheck,
  heart: Heart,
  award: Award,
  clock: Clock,
  recycle: Recycle,
  gem: Gem,
  package: Package,
  feather: Feather,
};

// Section props are admin-entered JSON, so read them defensively.
const str = (v: unknown) => (typeof v === "string" ? v : "");
const list = <T,>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;

const TONE = { default: "", surface: "tone-surface", dark: "tone-dark", primary: "tone-primary" };
const SPACE = {
  compact: "py-10 md:py-14",
  normal: "py-16 md:py-24",
  spacious: "py-20 md:py-32",
};

function Shell({ props, children }: { props: Props; children: React.ReactNode }) {
  const tone = pick(props.background, ["default", "surface", "dark", "primary"] as const, "default");
  const space = pick(props.spacing, ["compact", "normal", "spacious"] as const, "normal");
  return <section className={`${TONE[tone]} bg-bg text-ink ${SPACE[space]}`}>{children}</section>;
}

function Heading({ props, align = "center" }: { props: Props; align?: "center" | "left" }) {
  const eyebrow = str(props.eyebrow);
  const title = str(props.title);
  const subtitle = str(props.subtitle);
  if (!eyebrow && !title && !subtitle) return null;
  return (
    <div className={`mb-10 md:mb-14 ${align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      {title && <h2 className="heading text-4xl md:text-5xl">{title}</h2>}
      {subtitle && <p className="text-muted mt-4 leading-relaxed">{subtitle}</p>}
    </div>
  );
}

function Cta({ props, variant = "primary" }: { props: Props; variant?: "primary" | "outline" }) {
  const label = str(props.buttonLabel);
  if (!label) return null;
  return (
    <Link href={safeHref(props.buttonHref, "/shop")} className={`btn btn-${variant}`}>
      {label}
    </Link>
  );
}

function Hero({ props }: { props: Props }) {
  return (
    <HeroSlider
      slides={list<HeroSlide>(props.slides)}
      height={pick(props.height, ["medium", "tall", "full"] as const, "tall")}
      align={pick(props.align, ["left", "center"] as const, "left")}
      tone={pick(props.tone, ["light", "dark"] as const, "light")}
      overlay={pick(props.overlay, ["none", "light", "medium", "strong"] as const, "medium")}
      autoplay={props.autoplay !== false}
    />
  );
}

function Marquee({ props }: { props: Props }) {
  const items = list<string>(props.items).filter(Boolean);
  if (!items.length) return null;
  const tone = pick(props.background, ["default", "surface", "dark", "primary"] as const, "dark");
  // Repeat enough to fill wide screens, then duplicate once for a seamless loop.
  const run = Array.from({ length: Math.ceil(12 / items.length) }, () => items).flat();
  return (
    <section className={`${TONE[tone]} bg-bg text-ink overflow-hidden py-4`} aria-label={items.join(", ")}>
      <div className="animate-marquee flex w-max" aria-hidden="true">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0">
            {run.map((item, i) => (
              <span key={i} className="flex items-center text-xs tracking-[0.24em] whitespace-nowrap uppercase">
                <span className="px-8">{item}</span>
                <span className="text-accent">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

async function Products({ props }: { props: Props }) {
  const [catalog, { store }] = await Promise.all([getCatalog(), getSettings()]);
  const source = pick(props.source, ["featured", "newest", "category"] as const, "featured");
  const limit = Math.max(1, Math.min(24, Number(props.limit) || 4));
  let products = catalog;
  if (source === "featured") products = catalog.filter((p) => p.featured);
  if (source === "category" && str(props.categoryId)) {
    products = catalog.filter((p) => p.categoryId === props.categoryId);
  }
  products = products.slice(0, limit);
  if (!products.length) return null;
  return (
    <Shell props={props}>
      <div className="container-page">
        <Heading props={props} />
        <ProductGrid products={products} money={store} columns={props.columns === "3" ? 3 : 4} />
        {str(props.buttonLabel) && (
          <div className="mt-12 text-center">
            <Cta props={props} variant="outline" />
          </div>
        )}
      </div>
    </Shell>
  );
}

async function Categories({ props }: { props: Props }) {
  const categories = await getCategories();
  if (!categories.length) return null;
  return (
    <Shell props={props}>
      <div className="container-page">
        <Heading props={props} />
        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
          {categories.slice(0, 8).map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="group rounded-theme tone-image-light relative block aspect-[4/5] overflow-hidden bg-neutral-800"
            >
              {category.image && (
                <img
                  src={category.image}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
              <div className="text-ink absolute inset-x-0 bottom-0 p-5">
                <h3 className="heading text-2xl md:text-3xl">{category.name}</h3>
                <p className="mt-1 text-[0.7rem] tracking-[0.2em] uppercase opacity-80">Discover</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function Split({ props }: { props: Props }) {
  const image = str(props.image);
  const right = props.imageSide === "right";
  return (
    <Shell props={props}>
      <div className="container-page grid items-center gap-10 md:grid-cols-2 md:gap-16">
        {image && (
          <div className={`rounded-theme bg-surface aspect-[5/6] overflow-hidden ${right ? "md:order-2" : ""}`}>
            <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="max-w-lg">
          {str(props.eyebrow) && <p className="eyebrow mb-3">{str(props.eyebrow)}</p>}
          {str(props.title) && <h2 className="heading text-4xl md:text-5xl">{str(props.title)}</h2>}
          <Markdown source={props.body} className="mt-6" />
          {str(props.buttonLabel) && (
            <div className="mt-8">
              <Cta props={props} variant="outline" />
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

function BuilderPromo({ props }: { props: Props }) {
  const image = str(props.image);
  const steps = list<{ title?: string; text?: string }>(props.steps);
  return (
    <Shell props={props}>
      <div className="container-page grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <Heading props={props} align="left" />
          <ol className="space-y-6">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-5">
                <span className="heading text-accent border-line flex size-11 shrink-0 items-center justify-center rounded-full border text-xl">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="text-muted mt-1 text-sm leading-relaxed">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          {str(props.buttonLabel) && (
            <div className="mt-10">
              <Link href={safeHref(props.buttonHref, "/create")} className="btn btn-primary">
                {str(props.buttonLabel)}
              </Link>
            </div>
          )}
        </div>
        {image && (
          <div className="rounded-theme aspect-[5/6] overflow-hidden">
            <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
          </div>
        )}
      </div>
    </Shell>
  );
}

function Features({ props }: { props: Props }) {
  const items = list<{ icon?: string; title?: string; text?: string }>(props.items);
  if (!items.length) return null;
  return (
    <Shell props={props}>
      <div className="container-page">
        <div
          className={`grid gap-8 sm:grid-cols-2 ${items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
        >
          {items.map((item, i) => {
            const Icon = ICONS[item.icon ?? ""] ?? Sparkles;
            return (
              <div key={i} className="text-center">
                <Icon className="text-accent mx-auto size-7" strokeWidth={1.25} />
                <p className="mt-4 text-sm font-medium tracking-[0.14em] uppercase">{item.title}</p>
                <p className="text-muted mx-auto mt-2 max-w-[16rem] text-sm leading-relaxed">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}

function Testimonials({ props }: { props: Props }) {
  const items = list<{ quote?: string; author?: string; detail?: string }>(props.items);
  if (!items.length) return null;
  return (
    <Shell props={props}>
      <div className="container-page">
        <Heading props={props} />
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item, i) => (
            <figure key={i} className="border-line rounded-theme flex flex-col border p-8">
              <span className="heading text-accent text-5xl leading-none" aria-hidden="true">
                “
              </span>
              <blockquote className="heading -mt-2 flex-1 text-xl leading-snug md:text-2xl">
                {item.quote}
              </blockquote>
              <figcaption className="mt-6 text-xs tracking-[0.18em] uppercase">
                {item.author}
                {item.detail && <span className="text-muted"> · {item.detail}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function RichText({ props }: { props: Props }) {
  const center = props.align === "center";
  return (
    <Shell props={props}>
      <div className={`container-page ${center ? "text-center" : ""}`}>
        <div className="mx-auto max-w-3xl">
          {str(props.title) && <h1 className="heading mb-8 text-4xl md:text-6xl">{str(props.title)}</h1>}
          <Markdown source={props.body} />
        </div>
      </div>
    </Shell>
  );
}

function Faq({ props }: { props: Props }) {
  const items = list<{ question?: string; answer?: string }>(props.items);
  return (
    <Shell props={props}>
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          <Heading props={props} />
          <div className="border-line divide-line divide-y border-y">
            {items.map((item, i) => (
              <details key={i} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg [&::-webkit-details-marker]:hidden">
                  <span className="heading text-xl md:text-2xl">{item.question}</span>
                  <ChevronDown className="size-5 shrink-0 transition group-open:rotate-180" strokeWidth={1.5} />
                </summary>
                <Markdown source={item.answer} className="pt-4" />
              </details>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Banner({ props }: { props: Props }) {
  const image = str(props.image);
  const tone = props.tone === "dark" ? "tone-image-dark bg-white" : "tone-image-light bg-neutral-900";
  return (
    <section className={`relative overflow-hidden ${tone}`}>
      {image && <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
      <div className={`absolute inset-0 ${props.tone === "dark" ? "bg-white/20" : "bg-black/35"}`} />
      <div
        className={`container-page text-ink relative py-24 text-center md:py-36 ${props.tone === "dark" ? "" : "[&_h2]:[text-shadow:0_1px_14px_rgb(0_0_0/0.5)] [&_p]:[text-shadow:0_1px_14px_rgb(0_0_0/0.5)]"}`}
      >
        {str(props.eyebrow) && <p className="eyebrow mb-4">{str(props.eyebrow)}</p>}
        {str(props.title) && <h2 className="heading mx-auto max-w-3xl text-5xl md:text-7xl">{str(props.title)}</h2>}
        {str(props.subtitle) && (
          <p className="text-muted mx-auto mt-5 max-w-xl text-lg leading-relaxed">{str(props.subtitle)}</p>
        )}
        {str(props.buttonLabel) && (
          <div className="mt-9">
            <Cta props={props} />
          </div>
        )}
      </div>
    </section>
  );
}

function Gallery({ props }: { props: Props }) {
  const images = list<string>(props.images).filter(Boolean);
  if (!images.length) return null;
  const columns = { "2": "md:grid-cols-2", "3": "md:grid-cols-3", "4": "md:grid-cols-4" }[
    pick(props.columns, ["2", "3", "4"] as const, "3")
  ];
  return (
    <Shell props={props}>
      <div className="container-page">
        <Heading props={props} />
        <div className={`grid grid-cols-2 gap-3 md:gap-5 ${columns}`}>
          {images.map((src, i) => (
            <div key={i} className="rounded-theme bg-surface aspect-square overflow-hidden">
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function Newsletter({ props }: { props: Props }) {
  return (
    <Shell props={props}>
      <div className="container-page">
        <div className="mx-auto max-w-xl text-center">
          {str(props.title) && <h2 className="heading text-4xl md:text-5xl">{str(props.title)}</h2>}
          {str(props.subtitle) && <p className="text-muted mt-4 leading-relaxed">{str(props.subtitle)}</p>}
          <div className="mt-8">
            <NewsletterForm buttonLabel={str(props.buttonLabel)} />
          </div>
        </div>
      </div>
    </Shell>
  );
}

async function Contact({ props }: { props: Props }) {
  const { store } = await getSettings();
  const details = props.showDetails !== false;
  return (
    <Shell props={props}>
      <div className={`container-page grid gap-12 ${details ? "md:grid-cols-5" : ""}`}>
        <div className={details ? "md:col-span-2" : "mx-auto max-w-2xl text-center"}>
          {str(props.title) && <h1 className="heading text-4xl md:text-6xl">{str(props.title)}</h1>}
          {str(props.subtitle) && <p className="text-muted mt-4 leading-relaxed">{str(props.subtitle)}</p>}
          {details && (
            <ul className="mt-8 space-y-4 text-sm">
              {store.email && (
                <li className="flex items-start gap-3">
                  <Mail className="text-accent mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
                  <a href={`mailto:${store.email}`} className="link-underline">
                    {store.email}
                  </a>
                </li>
              )}
              {store.phone && (
                <li className="flex items-start gap-3">
                  <Phone className="text-accent mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
                  {store.phone}
                </li>
              )}
              {store.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="text-accent mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
                  {store.address}
                </li>
              )}
            </ul>
          )}
        </div>
        <div className={details ? "md:col-span-3" : "mx-auto w-full max-w-2xl"}>
          <ContactForm />
        </div>
      </div>
    </Shell>
  );
}

const COMPONENTS: Record<string, (p: { props: Props }) => React.ReactNode | Promise<React.ReactNode>> = {
  hero: Hero,
  marquee: Marquee,
  products: Products,
  categories: Categories,
  split: Split,
  builder: BuilderPromo,
  features: Features,
  testimonials: Testimonials,
  richText: RichText,
  faq: Faq,
  banner: Banner,
  gallery: Gallery,
  newsletter: Newsletter,
  contact: Contact,
};

/** Renders a CMS page: each stored section maps to a component above. */
export function RenderSections({ sections }: { sections: SectionData[] }) {
  return (
    <>
      {sections
        .filter((section) => section.enabled && COMPONENTS[section.type])
        .map((section) => {
          const Component = COMPONENTS[section.type];
          return <Component key={section.id} props={section.props ?? {}} />;
        })}
    </>
  );
}
