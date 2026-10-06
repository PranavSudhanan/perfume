import { DEFAULT_THEME, type ThemeSettings } from "./theme";
import { withDefaults } from "./utils";

export type NavLink = { label: string; href: string };

export type StoreSettings = {
  name: string;
  tagline: string;
  logo: string;
  email: string;
  phone: string;
  address: string;
  currencyCode: string;
  locale: string;
  instagram: string;
  facebook: string;
  youtube: string;
  whatsapp: string;
  seoTitle: string;
  seoDescription: string;
  socialImage: string;
};

export type NavigationSettings = {
  announcementEnabled: boolean;
  announcements: string[];
  announcementHref: string;
  header: NavLink[];
  footerAbout: string;
  footerColumns: { title: string; links: NavLink[] }[];
  footerNewsletter: boolean;
  copyright: string;
};

export type CheckoutSettings = {
  shippingFlat: number;
  freeShippingAbove: number;
  taxPercent: number;
  codEnabled: boolean;
  onlineEnabled: boolean;
  orderPrefix: string;
  country: string;
  checkoutNote: string;
};

export type BuilderStep = {
  key: string;
  title: string;
  subtitle: string;
  min: number;
  max: number;
};

export type BuilderSettings = {
  enabled: boolean;
  productName: string;
  title: string;
  subtitle: string;
  basePrice: number;
  leadTime: string;
  steps: BuilderStep[];
  labelEnabled: boolean;
  labelMaxChars: number;
  labelPrice: number;
  giftMessageEnabled: boolean;
};

export type SiteSettings = {
  store: StoreSettings;
  theme: ThemeSettings;
  navigation: NavigationSettings;
  checkout: CheckoutSettings;
  builder: BuilderSettings;
};

export type SettingsKey = keyof SiteSettings;
export const SETTINGS_KEYS: SettingsKey[] = ["store", "theme", "navigation", "checkout", "builder"];

export const DEFAULT_SETTINGS: SiteSettings = {
  store: {
    name: "Aurelle",
    tagline: "Bespoke perfumery",
    logo: "",
    email: "hello@example.com",
    phone: "+91 90000 00000",
    address: "12 Atelier Lane, Bengaluru 560001, India",
    currencyCode: "INR",
    locale: "en-IN",
    instagram: "",
    facebook: "",
    youtube: "",
    whatsapp: "",
    seoTitle: "Aurelle — Bespoke perfumes, blended for you",
    seoDescription:
      "Design a perfume that is entirely yours. Choose your notes, name your bottle, and we blend it by hand.",
    socialImage: "",
  },
  theme: DEFAULT_THEME,
  navigation: {
    announcementEnabled: true,
    announcements: [
      "Complimentary shipping on orders above ₹2,500",
      "Every bespoke blend is made to order in 5–7 days",
    ],
    announcementHref: "/create",
    header: [
      { label: "Shop", href: "/shop" },
      { label: "Create your own", href: "/create" },
      { label: "Our story", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    footerAbout:
      "A small perfume atelier blending made-to-order fragrances from carefully sourced essences.",
    footerColumns: [
      {
        title: "Shop",
        links: [
          { label: "All perfumes", href: "/shop" },
          { label: "Create your own", href: "/create" },
          { label: "Track an order", href: "/track" },
        ],
      },
      {
        title: "Atelier",
        links: [
          { label: "Our story", href: "/about" },
          { label: "Contact", href: "/contact" },
          { label: "FAQ", href: "/faq" },
        ],
      },
      {
        title: "Policies",
        links: [
          { label: "Shipping & returns", href: "/shipping-returns" },
          { label: "Privacy policy", href: "/privacy" },
          { label: "Terms of service", href: "/terms" },
        ],
      },
    ],
    footerNewsletter: true,
    copyright: "All rights reserved.",
  },
  checkout: {
    shippingFlat: 9900,
    freeShippingAbove: 250000,
    taxPercent: 0,
    codEnabled: true,
    onlineEnabled: true,
    orderPrefix: "AU",
    country: "India",
    checkoutNote: "Prices include all taxes. Bespoke blends ship within 5–7 working days.",
  },
  builder: {
    enabled: true,
    productName: "Bespoke Perfume",
    title: "Compose your signature scent",
    subtitle: "Pick a size, layer your notes, and name the bottle. We blend it by hand, just for you.",
    basePrice: 0,
    leadTime: "Hand-blended to order · ships in 5–7 working days",
    steps: [
      { key: "size", title: "Bottle size", subtitle: "How much would you like?", min: 1, max: 1 },
      {
        key: "concentration",
        title: "Concentration",
        subtitle: "Higher concentrations last longer on skin.",
        min: 1,
        max: 1,
      },
      {
        key: "top",
        title: "Top notes",
        subtitle: "The first impression — bright and fleeting.",
        min: 1,
        max: 2,
      },
      {
        key: "heart",
        title: "Heart notes",
        subtitle: "The character of your perfume once it settles.",
        min: 1,
        max: 2,
      },
      {
        key: "base",
        title: "Base notes",
        subtitle: "The lasting trail that stays for hours.",
        min: 1,
        max: 2,
      },
      {
        key: "finish",
        title: "Finishing touches",
        subtitle: "Optional extras for gifting.",
        min: 0,
        max: 2,
      },
    ],
    labelEnabled: true,
    labelMaxChars: 18,
    labelPrice: 0,
    giftMessageEnabled: true,
  },
};

/** Builds the full settings object from stored rows, falling back to defaults for anything missing. */
export function resolveSettings(rows: { key: string; value: unknown }[]): SiteSettings {
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    store: withDefaults(DEFAULT_SETTINGS.store, stored.store),
    theme: withDefaults(DEFAULT_SETTINGS.theme, stored.theme),
    navigation: withDefaults(DEFAULT_SETTINGS.navigation, stored.navigation),
    checkout: withDefaults(DEFAULT_SETTINGS.checkout, stored.checkout),
    builder: withDefaults(DEFAULT_SETTINGS.builder, stored.builder),
  };
}
