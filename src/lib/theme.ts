export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  primary: string;
  primaryText: string;
  accent: string;
  border: string;
};

export type ThemeSettings = {
  preset: string;
  colors: ThemeColors;
  headingFont: string;
  bodyFont: string;
  headingCase: "normal" | "uppercase";
  radius: "none" | "soft" | "round" | "pill";
  buttonStyle: "solid" | "outline";
  containerWidth: "narrow" | "normal" | "wide";
  headerLayout: "left" | "center";
  headerSticky: boolean;
  cardStyle: "plain" | "boxed";
  imageRatio: "square" | "portrait" | "tall";
};

type FontDef = { weights: string; fallback: "serif" | "sans-serif" };

/** Google Fonts the admin can choose from. `weights` lists what each family actually ships. */
export const FONTS: Record<string, FontDef> = {
  "Cormorant Garamond": { weights: "400;500;600;700", fallback: "serif" },
  "Playfair Display": { weights: "400;500;600;700", fallback: "serif" },
  "Bodoni Moda": { weights: "400;500;600;700", fallback: "serif" },
  Fraunces: { weights: "400;500;600;700", fallback: "serif" },
  Cinzel: { weights: "400;500;600;700", fallback: "serif" },
  "Libre Baskerville": { weights: "400;700", fallback: "serif" },
  "DM Serif Display": { weights: "400", fallback: "serif" },
  Marcellus: { weights: "400", fallback: "serif" },
  Prata: { weights: "400", fallback: "serif" },
  Italiana: { weights: "400", fallback: "serif" },
  "Tenor Sans": { weights: "400", fallback: "sans-serif" },
  Syne: { weights: "400;500;600;700", fallback: "sans-serif" },
  Jost: { weights: "300;400;500;600", fallback: "sans-serif" },
  Inter: { weights: "300;400;500;600", fallback: "sans-serif" },
  Manrope: { weights: "300;400;500;600", fallback: "sans-serif" },
  "DM Sans": { weights: "300;400;500;600", fallback: "sans-serif" },
  "Work Sans": { weights: "300;400;500;600", fallback: "sans-serif" },
  Outfit: { weights: "300;400;500;600", fallback: "sans-serif" },
  Poppins: { weights: "300;400;500;600", fallback: "sans-serif" },
  Montserrat: { weights: "300;400;500;600", fallback: "sans-serif" },
  Raleway: { weights: "300;400;500;600", fallback: "sans-serif" },
  Lato: { weights: "300;400;700", fallback: "sans-serif" },
};

export const FONT_NAMES = Object.keys(FONTS);

type Preset = {
  label: string;
  colors: ThemeColors;
  headingFont: string;
  bodyFont: string;
};

export const THEME_PRESETS: Record<string, Preset> = {
  ivory: {
    label: "Ivory & Gold",
    colors: {
      background: "#faf7f2",
      surface: "#f1ebe1",
      text: "#1f1b16",
      muted: "#6f665a",
      primary: "#1f1b16",
      primaryText: "#faf7f2",
      accent: "#a07a35",
      border: "#e2d9cb",
    },
    headingFont: "Cormorant Garamond",
    bodyFont: "Jost",
  },
  noir: {
    label: "Noir",
    colors: {
      background: "#0e0d0c",
      surface: "#191715",
      text: "#f3ede4",
      muted: "#a39a8c",
      primary: "#c9a45c",
      primaryText: "#0e0d0c",
      accent: "#c9a45c",
      border: "#2b2824",
    },
    headingFont: "Bodoni Moda",
    bodyFont: "Manrope",
  },
  rose: {
    label: "Rose Atelier",
    colors: {
      background: "#fff8f6",
      surface: "#fbe9e4",
      text: "#3b2228",
      muted: "#8a6a70",
      primary: "#8c3b4a",
      primaryText: "#fff8f6",
      accent: "#b9654c",
      border: "#f0d6cf",
    },
    headingFont: "Playfair Display",
    bodyFont: "DM Sans",
  },
  sage: {
    label: "Sage Botanica",
    colors: {
      background: "#f6f7f1",
      surface: "#e8ecdf",
      text: "#232b22",
      muted: "#667062",
      primary: "#3e5641",
      primaryText: "#f6f7f1",
      accent: "#96703c",
      border: "#d7ddcb",
    },
    headingFont: "Fraunces",
    bodyFont: "Work Sans",
  },
  midnight: {
    label: "Midnight Oud",
    colors: {
      background: "#10131c",
      surface: "#181c28",
      text: "#eef0f6",
      muted: "#9aa1b5",
      primary: "#e4d4b0",
      primaryText: "#10131c",
      accent: "#c7a977",
      border: "#272c3b",
    },
    headingFont: "Cinzel",
    bodyFont: "Inter",
  },
  mono: {
    label: "Modern Mono",
    colors: {
      background: "#ffffff",
      surface: "#f4f4f5",
      text: "#111111",
      muted: "#6b6b6b",
      primary: "#111111",
      primaryText: "#ffffff",
      accent: "#b4512e",
      border: "#e5e5e5",
    },
    headingFont: "Tenor Sans",
    bodyFont: "Inter",
  },
};

export const DEFAULT_THEME: ThemeSettings = {
  preset: "ivory",
  colors: THEME_PRESETS.ivory.colors,
  headingFont: THEME_PRESETS.ivory.headingFont,
  bodyFont: THEME_PRESETS.ivory.bodyFont,
  headingCase: "normal",
  radius: "soft",
  buttonStyle: "solid",
  containerWidth: "normal",
  headerLayout: "left",
  headerSticky: true,
  cardStyle: "plain",
  imageRatio: "portrait",
};

const HEX = /^#[0-9a-f]{3,8}$/i;
const RADIUS = { none: ["0px", "0px"], soft: ["6px", "4px"], round: ["16px", "12px"], pill: ["20px", "999px"] };
const WIDTH = { narrow: "1100px", normal: "1280px", wide: "1480px" };
const RATIO = { square: "1 / 1", portrait: "4 / 5", tall: "3 / 4" };

function font(name: string, fallbackName: string) {
  const safe = FONTS[name] ? name : fallbackName;
  return { name: safe, def: FONTS[safe] };
}

/**
 * CSS custom properties for the active theme. Every value is validated against an
 * allow-list or a hex pattern, so nothing free-form reaches the stylesheet.
 */
export function themeVars(theme: ThemeSettings): Record<string, string> {
  const d = DEFAULT_THEME;
  const color = (key: keyof ThemeColors) =>
    HEX.test(theme.colors?.[key] ?? "") ? theme.colors[key] : d.colors[key];
  const heading = font(theme.headingFont, d.headingFont);
  const body = font(theme.bodyFont, d.bodyFont);
  const [radius, buttonRadius] = RADIUS[theme.radius] ?? RADIUS.soft;
  return {
    "--p-bg": color("background"),
    "--p-surface": color("surface"),
    "--p-text": color("text"),
    "--p-muted": color("muted"),
    "--p-primary": color("primary"),
    "--p-primary-text": color("primaryText"),
    "--p-accent": color("accent"),
    "--p-border": color("border"),
    "--f-heading": `"${heading.name}", ${heading.def.fallback}`,
    "--f-body": `"${body.name}", ${body.def.fallback}`,
    "--r-base": radius,
    "--r-btn": buttonRadius,
    "--w-container": WIDTH[theme.containerWidth] ?? WIDTH.normal,
    "--ratio-card": RATIO[theme.imageRatio] ?? RATIO.portrait,
    "--heading-case": theme.headingCase === "uppercase" ? "uppercase" : "none",
    "--heading-spacing": theme.headingCase === "uppercase" ? "0.08em" : "0",
  };
}

export function themeCss(theme: ThemeSettings) {
  const vars = Object.entries(themeVars(theme))
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  return `:root{${vars}}`;
}

export function fontsHref(theme: ThemeSettings) {
  const names = [...new Set([theme.headingFont, theme.bodyFont])].filter((n) => FONTS[n]);
  if (!names.length) names.push(DEFAULT_THEME.headingFont, DEFAULT_THEME.bodyFont);
  const families = names
    .map((n) => `family=${n.replace(/ /g, "+")}:wght@${FONTS[n].weights}`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
