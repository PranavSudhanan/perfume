// Generates the placeholder artwork in public/art used by the seeded demo content.
// Run with `node scripts/gen-art.mjs`. Replace the images from the admin panel at any time.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "art");
mkdirSync(out, { recursive: true });

const SERIF = `Georgia, 'Times New Roman', serif`;

const BODIES = {
  square: {
    cap: `<rect x="-58" y="-310" width="116" height="122" rx="8"/>`,
    collar: `<rect x="-40" y="-190" width="80" height="28"/>`,
    body: `<rect x="-150" y="-164" width="300" height="474" rx="26"/>`,
    level: -110,
    highlight: [-128, -120, 380],
    labelY: 90,
  },
  round: {
    cap: `<circle cx="0" cy="-252" r="58"/>`,
    collar: `<rect x="-34" y="-198" width="68" height="36"/>`,
    body: `<rect x="-185" y="-164" width="370" height="474" rx="150"/>`,
    level: -90,
    highlight: [-140, -40, 220],
    labelY: 80,
  },
  tall: {
    cap: `<rect x="-44" y="-310" width="88" height="152" rx="6"/>`,
    collar: `<rect x="-36" y="-160" width="72" height="22"/>`,
    body: `<rect x="-112" y="-140" width="224" height="450" rx="34"/>`,
    level: -92,
    highlight: [-92, -90, 340],
    labelY: 100,
  },
  arch: {
    cap: `<rect x="-50" y="-310" width="100" height="98" rx="49"/>`,
    collar: `<rect x="-32" y="-214" width="64" height="30"/>`,
    body: `<path d="M-150 290V-36A150 150 0 0 1 150-36V290Q150 310 130 310H-130Q-150 310-150 290Z"/>`,
    level: -70,
    highlight: [-126, -20, 280],
    labelY: 110,
  },
};

/** Gradients a bottle needs, namespaced by `id` so several bottles can share one SVG. */
function bottleDefs(id, p, shape) {
  const b = BODIES[shape];
  return `
    <linearGradient id="liq-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.liquid}"/><stop offset="1" stop-color="${p.liquidDark}"/>
    </linearGradient>
    <linearGradient id="cap-${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${p.cap}"/><stop offset=".45" stop-color="${p.capLight}"/><stop offset="1" stop-color="${p.cap}"/>
    </linearGradient>
    <clipPath id="clip-${id}">${b.body}</clipPath>`;
}

function bottle(id, p, shape, name, x, y, scale = 1, showLabel = true) {
  const b = BODIES[shape];
  const [hx, hy, hh] = b.highlight;
  const label = showLabel
    ? `<g transform="translate(0 ${b.labelY})">
        <rect x="-84" y="-66" width="168" height="132" fill="${p.label}"/>
        <rect x="-76" y="-58" width="152" height="116" fill="none" stroke="${p.ink}" stroke-opacity=".35"/>
        <text y="-6" text-anchor="middle" font-family="${SERIF}" font-size="${name.length > 9 ? 17 : 21}" letter-spacing="4" fill="${p.ink}">${name.toUpperCase()}</text>
        <line x1="-22" x2="22" y1="14" y2="14" stroke="${p.ink}" stroke-opacity=".5"/>
        <text y="36" text-anchor="middle" font-family="${SERIF}" font-size="9" letter-spacing="3" fill="${p.ink}" fill-opacity=".7">EAU DE PARFUM</text>
      </g>`
    : "";
  return `
  <g transform="translate(${x} ${y}) scale(${scale})">
    <ellipse cx="0" cy="316" rx="190" ry="15" fill="#000" opacity=".2" filter="url(#soft)"/>
    <g fill="url(#cap-${id})">${b.cap}</g>
    <g fill="${p.cap}" opacity=".85">${b.collar}</g>
    <g fill="#fff" fill-opacity=".22" stroke="#fff" stroke-opacity=".6" stroke-width="3">${b.body}</g>
    <g clip-path="url(#clip-${id})">
      <rect x="-240" y="${b.level}" width="480" height="640" fill="url(#liq-${id})" opacity=".94"/>
      <rect x="-240" y="${b.level}" width="480" height="5" fill="#fff" opacity=".35"/>
      <rect x="-240" y="276" width="480" height="40" fill="#000" opacity=".1"/>
      <rect x="${hx}" y="${hy}" width="14" height="${hh}" rx="7" fill="#fff" opacity=".38"/>
      <rect x="${hx + 24}" y="${hy + 30}" width="5" height="${hh - 120}" rx="2.5" fill="#fff" opacity=".22"/>
    </g>
    ${label}
  </g>`;
}

const softFilter = `<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .06 0"/></filter>`;

function svg(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>\n`;
}

function productShot(p, shape, name) {
  return svg(
    800,
    1000,
    `<defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.bgA}"/><stop offset="1" stop-color="${p.bgB}"/></linearGradient>
      ${softFilter}${bottleDefs("a", p, shape)}
    </defs>
    <rect width="800" height="1000" fill="url(#bg)"/>
    <circle cx="400" cy="470" r="250" fill="${p.glow}" opacity=".55" filter="url(#glow)"/>
    <rect x="170" y="130" width="460" height="760" rx="230" fill="#fff" opacity="${p.dark ? 0.05 : 0.34}"/>
    <rect y="826" width="800" height="174" fill="#000" opacity="${p.dark ? 0.28 : 0.06}"/>
    <rect y="826" width="800" height="2" fill="#fff" opacity="${p.dark ? 0.08 : 0.5}"/>
    ${bottle("a", p, shape, name, 400, 528, 0.94)}
    <rect width="800" height="1000" filter="url(#grain)"/>`,
  );
}

function detailShot(p, shape, name, notes) {
  const dots = notes
    .map(
      (c, i) =>
        `<circle cx="${130 + i * 46}" cy="${150 + (i % 2) * 34}" r="${58 - i * 8}" fill="${c}" opacity=".85"/>`,
    )
    .join("");
  return svg(
    800,
    1000,
    `<defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bgB}"/><stop offset="1" stop-color="${p.bgA}"/></linearGradient>
      ${softFilter}${bottleDefs("a", p, shape)}
    </defs>
    <rect width="800" height="1000" fill="url(#bg)"/>
    <circle cx="560" cy="620" r="300" fill="${p.glow}" opacity=".5" filter="url(#glow)"/>
    <circle cx="610" cy="250" r="170" fill="none" stroke="#fff" stroke-opacity="${p.dark ? 0.12 : 0.6}" stroke-width="2"/>
    <circle cx="610" cy="250" r="120" fill="#fff" opacity="${p.dark ? 0.04 : 0.28}"/>
    ${dots}
    ${bottle("a", p, shape, name, 440, 690, 1.42)}
    <rect width="800" height="1000" filter="url(#grain)"/>`,
  );
}

function heroScene(p, shape, name) {
  return svg(
    1920,
    1080,
    `<defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bgA}"/><stop offset="1" stop-color="${p.bgB}"/></linearGradient>
      <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p.bgA}" stop-opacity=".9"/><stop offset=".55" stop-color="${p.bgA}" stop-opacity="0"/></linearGradient>
      ${softFilter}${bottleDefs("a", p, shape)}${bottleDefs("b", p.second, "tall")}
    </defs>
    <rect width="1920" height="1080" fill="url(#bg)"/>
    <circle cx="1380" cy="520" r="430" fill="${p.glow}" opacity=".55" filter="url(#glow)"/>
    <circle cx="420" cy="980" r="320" fill="${p.glow}" opacity=".22" filter="url(#glow)"/>
    <rect x="1090" y="110" width="580" height="1100" rx="290" fill="#fff" opacity=".06"/>
    <rect x="1130" y="150" width="500" height="1100" rx="250" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="2"/>
    <circle cx="1720" cy="250" r="90" fill="none" stroke="${p.capLight}" stroke-opacity=".5" stroke-width="2"/>
    <circle cx="1720" cy="250" r="58" fill="${p.capLight}" opacity=".16"/>
    <rect y="900" width="1920" height="180" fill="#000" opacity=".3"/>
    <rect y="900" width="1920" height="2" fill="#fff" opacity=".1"/>
    ${bottle("b", p.second, "tall", "", 1610, 690, 0.66, false)}
    ${bottle("a", p, shape, name, 1360, 560, 1.08)}
    <rect width="1920" height="1080" fill="url(#fade)"/>
    <rect width="1920" height="1080" filter="url(#grain)"/>`,
  );
}

function storyScene(p, palettes) {
  const [a, b, c] = palettes;
  return svg(
    1200,
    1400,
    `<defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.bgA}"/><stop offset="1" stop-color="${p.bgB}"/></linearGradient>
      ${softFilter}${bottleDefs("a", a, "tall")}${bottleDefs("b", b, "square")}${bottleDefs("c", c, "round")}
    </defs>
    <rect width="1200" height="1400" fill="url(#bg)"/>
    <circle cx="600" cy="640" r="380" fill="${p.glow}" opacity=".55" filter="url(#glow)"/>
    <rect x="250" y="170" width="700" height="1100" rx="350" fill="#fff" opacity=".4"/>
    <rect y="1100" width="1200" height="300" fill="#000" opacity=".07"/>
    <rect y="1100" width="1200" height="2" fill="#fff" opacity=".6"/>
    ${bottle("a", a, "tall", "", 330, 850, 0.78, false)}
    ${bottle("c", c, "round", "", 880, 900, 0.62, false)}
    ${bottle("b", b, "square", p.name, 610, 760, 1.08)}
    <rect width="1200" height="1400" filter="url(#grain)"/>`,
  );
}

function ingredientScene(p, colors) {
  const rings = colors
    .map((c, i) => {
      const x = [300, 820, 520, 930, 220, 640][i];
      const y = [330, 280, 620, 760, 900, 1080][i];
      const r = [150, 110, 190, 130, 120, 100][i];
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity=".9"/>
        <circle cx="${x}" cy="${y}" r="${r + 26}" fill="none" stroke="${c}" stroke-opacity=".5" stroke-width="2"/>`;
    })
    .join("");
  return svg(
    1200,
    1400,
    `<defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bgA}"/><stop offset="1" stop-color="${p.bgB}"/></linearGradient>
      ${softFilter}${bottleDefs("a", p, "arch")}
    </defs>
    <rect width="1200" height="1400" fill="url(#bg)"/>
    <circle cx="600" cy="700" r="420" fill="${p.glow}" opacity=".45" filter="url(#glow)"/>
    ${rings}
    ${bottle("a", p, "arch", p.name, 610, 760, 1.2)}
    <rect width="1200" height="1400" filter="url(#grain)"/>`,
  );
}

function categoryTile(p, motif) {
  const motifs = {
    petals: Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return `<ellipse cx="${450 + Math.cos(a) * 150}" cy="${520 + Math.sin(a) * 150}" rx="150" ry="78" transform="rotate(${(i * 45).toFixed(0)} ${450 + Math.cos(a) * 150} ${520 + Math.sin(a) * 150})" fill="${p.liquid}" opacity=".5"/>`;
    }).join("") + `<circle cx="450" cy="520" r="70" fill="${p.capLight}" opacity=".9"/>`,
    rings: Array.from(
      { length: 9 },
      (_, i) =>
        `<circle cx="450" cy="540" r="${50 + i * 42}" fill="none" stroke="${p.liquidDark}" stroke-opacity="${0.75 - i * 0.07}" stroke-width="${10 - i}"/>`,
    ).join(""),
    waves: Array.from(
      { length: 7 },
      (_, i) =>
        `<path d="M-50 ${330 + i * 85} Q 175 ${250 + i * 85} 450 ${330 + i * 85} T 950 ${330 + i * 85}" fill="none" stroke="${i % 2 ? p.liquid : p.liquidDark}" stroke-opacity=".7" stroke-width="${18 - i * 1.5}" stroke-linecap="round"/>`,
    ).join("") + `<circle cx="660" cy="250" r="96" fill="${p.capLight}" opacity=".85"/>`,
    sun: Array.from({ length: 16 }, (_, i) => {
      const a = (i * Math.PI) / 8;
      return `<line x1="${450 + Math.cos(a) * 170}" y1="${540 + Math.sin(a) * 170}" x2="${450 + Math.cos(a) * 330}" y2="${540 + Math.sin(a) * 330}" stroke="${p.capLight}" stroke-opacity=".7" stroke-width="4" stroke-linecap="round"/>`;
    }).join("") + `<circle cx="450" cy="540" r="140" fill="${p.liquid}"/><circle cx="450" cy="540" r="96" fill="${p.liquidDark}" opacity=".6"/>`,
  };
  return svg(
    900,
    1100,
    `<defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bgA}"/><stop offset="1" stop-color="${p.bgB}"/></linearGradient>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
      ${softFilter}
    </defs>
    <rect width="900" height="1100" fill="url(#bg)"/>
    <circle cx="450" cy="520" r="330" fill="${p.glow}" opacity=".5" filter="url(#glow)"/>
    ${motifs[motif]}
    <rect width="900" height="1100" fill="url(#shade)"/>
    <rect width="900" height="1100" filter="url(#grain)"/>`,
  );
}

const cream = { label: "#f7f1e3", ink: "#2a2118" };
const gold = { cap: "#b8924a", capLight: "#f3deaa" };
const silver = { cap: "#a9a9a9", capLight: "#f2f2f2" };
const black = { cap: "#1d1b19", capLight: "#5c5853" };

export const PRODUCTS = {
  noor: { ...cream, ...gold, bgA: "#f4e9d6", bgB: "#e4cfae", liquid: "#e0b04f", liquidDark: "#b47a1f", glow: "#fff3d0", shape: "square", name: "Noor", notes: ["#e0b04f", "#c9773a", "#7a4a2b"] },
  "rosa-nocturne": { ...cream, cap: "#b98372", capLight: "#f1cfc1", bgA: "#f8e4e1", bgB: "#e9c3c0", liquid: "#eaa9ae", liquidDark: "#c36c79", glow: "#fff0ee", shape: "round", name: "Rosa", notes: ["#e58f9b", "#c9537a", "#f3d3c4"] },
  "vetiver-rain": { ...cream, ...black, bgA: "#e6ecdc", bgB: "#c8d6b9", liquid: "#bdd193", liquidDark: "#7b9853", glow: "#f6fbe9", shape: "tall", name: "Vetiver", notes: ["#9cb86a", "#5f7f4a", "#d8d29a"] },
  "oud-royale": { ...cream, ...gold, bgA: "#33271f", bgB: "#120d0a", liquid: "#8a4a22", liquidDark: "#4a210c", glow: "#a8672c", shape: "square", name: "Oud", dark: true, notes: ["#8a4a22", "#c79a4a", "#3b1e12"] },
  "jasmine-veil": { ...cream, ...gold, bgA: "#f6f2e7", bgB: "#e5dcc4", liquid: "#f1e3a7", liquidDark: "#d2b962", glow: "#ffffff", shape: "arch", name: "Jasmine", notes: ["#f1e3a7", "#ffffff", "#c9d6a3"] },
  "citrus-atlas": { ...cream, ...silver, bgA: "#fcf1cc", bgB: "#f1d587", liquid: "#f7c948", liquidDark: "#df981a", glow: "#fffbe6", shape: "tall", name: "Citrus", notes: ["#f7c948", "#f08a2e", "#b6c94a"] },
  "santal-dusk": { ...cream, cap: "#5a3a23", capLight: "#9a6a43", bgA: "#ebdfce", bgB: "#d2bc9e", liquid: "#c99c6c", liquidDark: "#925f35", glow: "#fff2df", shape: "round", name: "Santal", notes: ["#c99c6c", "#7d5233", "#e7cfa8"] },
  "blue-monsoon": { ...cream, ...silver, bgA: "#deeaf0", bgB: "#b9cfdc", liquid: "#93bcd3", liquidDark: "#5a88a6", glow: "#f1f9fd", shape: "arch", name: "Monsoon", notes: ["#93bcd3", "#5a88a6", "#d9e6c4"] },
};

for (const [slug, p] of Object.entries(PRODUCTS)) {
  writeFileSync(join(out, `${slug}.svg`), productShot(p, p.shape, p.name));
  writeFileSync(join(out, `${slug}-detail.svg`), detailShot(p, p.shape, p.name, p.notes));
}

const second = { ...cream, ...gold, liquid: "#f1e3a7", liquidDark: "#c9a64e" };
writeFileSync(
  join(out, "hero-1.svg"),
  heroScene({ ...cream, ...gold, bgA: "#231a14", bgB: "#0d0907", liquid: "#e0b04f", liquidDark: "#a8691a", glow: "#b9782f", second }, "square", "Aurelle"),
);
writeFileSync(
  join(out, "hero-2.svg"),
  heroScene({ ...cream, ...gold, bgA: "#1c2a22", bgB: "#0a120d", liquid: "#bdd193", liquidDark: "#6f8f49", glow: "#4f7a55", second }, "arch", "Verdant"),
);
writeFileSync(
  join(out, "hero-3.svg"),
  heroScene({ ...cream, cap: "#b98372", capLight: "#f1cfc1", bgA: "#2c1a22", bgB: "#120a0e", liquid: "#eaa9ae", liquidDark: "#b55a6b", glow: "#8f4458", second }, "round", "Bespoke"),
);

writeFileSync(
  join(out, "story-1.svg"),
  storyScene({ bgA: "#f1e7d8", bgB: "#dccbb0", glow: "#fff6e3", name: "Atelier" }, [
    PRODUCTS["vetiver-rain"],
    PRODUCTS.noor,
    PRODUCTS["rosa-nocturne"],
  ]),
);
writeFileSync(
  join(out, "story-2.svg"),
  ingredientScene(
    { ...cream, ...gold, bgA: "#efe6d6", bgB: "#e0cfb4", liquid: "#e7c98b", liquidDark: "#c59a4a", glow: "#fff6e3", name: "Yours" },
    ["#eaa9ae", "#bdd193", "#f7c948", "#c99c6c", "#93bcd3", "#8a4a22"],
  ),
);

writeFileSync(join(out, "cat-floral.svg"), categoryTile({ bgA: "#f6dcd9", bgB: "#d9a3a6", liquid: "#f2b6bb", liquidDark: "#c36c79", capLight: "#fbe9c9", glow: "#fff0ee" }, "petals"));
writeFileSync(join(out, "cat-woody.svg"), categoryTile({ bgA: "#e2cfb6", bgB: "#8f6a47", liquid: "#c99c6c", liquidDark: "#6b4426", capLight: "#f3deaa", glow: "#fff2df" }, "rings"));
writeFileSync(join(out, "cat-fresh.svg"), categoryTile({ bgA: "#e3efe2", bgB: "#8fb4a3", liquid: "#cfe3b4", liquidDark: "#5f8f7c", capLight: "#fbe58f", glow: "#f6fbe9" }, "waves"));
writeFileSync(join(out, "cat-oriental.svg"), categoryTile({ bgA: "#4a2f1f", bgB: "#1b100a", liquid: "#d9963a", liquidDark: "#7a3e1d", capLight: "#f3deaa", glow: "#a8672c" }, "sun"));

console.log(`Artwork written to ${out}`);
