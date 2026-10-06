import type { SectionData } from "../src/db/schema";
import { DEMO_IMAGES } from "../src/lib/demo-images";
import { createSection } from "../src/lib/sections";

export const seedCategories = [
  {
    name: "Floral",
    slug: "floral",
    description: "Rose, jasmine and white petals — soft, romantic and luminous.",
    image: DEMO_IMAGES.categories.floral,
    sortOrder: 1,
  },
  {
    name: "Woody",
    slug: "woody",
    description: "Sandalwood, cedar and vetiver — warm, grounded and quietly confident.",
    image: DEMO_IMAGES.categories.woody,
    sortOrder: 2,
  },
  {
    name: "Fresh",
    slug: "fresh",
    description: "Citrus, green leaves and sea air — crisp and effortless.",
    image: DEMO_IMAGES.categories.fresh,
    sortOrder: 3,
  },
  {
    name: "Oriental",
    slug: "oriental",
    description: "Oud, amber and spice — deep, opulent and lingering.",
    image: DEMO_IMAGES.categories.oriental,
    sortOrder: 4,
  },
];

type SeedProduct = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  gender: "unisex" | "women" | "men";
  scentFamily: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  badge?: string;
  featured?: boolean;
  /** Price of the 50 ml bottle in minor units; other sizes are derived from it. */
  price: number;
  compareAt?: number;
};

export const seedProducts: SeedProduct[] = [
  {
    slug: "noor",
    name: "Noor",
    tagline: "Golden amber and saffron light",
    description:
      "Noor opens with a flash of saffron and bergamot, then settles into honeyed amber and warm labdanum. A glowing, skin-close perfume that feels like late afternoon sun.\n\nBlended in small batches and left to mature for four weeks before bottling.",
    category: "oriental",
    gender: "unisex",
    scentFamily: "Amber",
    topNotes: ["Saffron", "Bergamot"],
    heartNotes: ["Amber", "Labdanum", "Rose"],
    baseNotes: ["Vanilla", "Sandalwood", "Musk"],
    badge: "Bestseller",
    featured: true,
    price: 249000,
    compareAt: 289000,
  },
  {
    slug: "rosa-nocturne",
    name: "Rosa Nocturne",
    tagline: "Damask rose after dark",
    description:
      "A velvety rose with a shadow. Pink pepper and lychee lift the opening; Damask rose and peony bloom at the heart; patchouli and soft musk linger through the night.",
    category: "floral",
    gender: "women",
    scentFamily: "Floral",
    topNotes: ["Pink Pepper", "Lychee"],
    heartNotes: ["Damask Rose", "Peony"],
    baseNotes: ["Patchouli", "White Musk"],
    featured: true,
    price: 229000,
  },
  {
    slug: "vetiver-rain",
    name: "Vetiver Rain",
    tagline: "Green roots and first monsoon",
    description:
      "The smell of wet earth after the first rain. Crushed green leaves and grapefruit over cool vetiver and cedar, finished with a clean mineral musk.",
    category: "fresh",
    gender: "men",
    scentFamily: "Green",
    topNotes: ["Grapefruit", "Green Leaves"],
    heartNotes: ["Vetiver", "Geranium"],
    baseNotes: ["Cedarwood", "Mineral Musk"],
    badge: "New",
    featured: true,
    price: 219000,
  },
  {
    slug: "oud-royale",
    name: "Oud Royale",
    tagline: "Smoked oud, leather and gold",
    description:
      "Our richest composition. Aged oud and smoked leather are softened with rose and a thread of saffron, resting on a base of amber and tonka. Two sprays last from morning to midnight.",
    category: "oriental",
    gender: "unisex",
    scentFamily: "Oud",
    topNotes: ["Saffron", "Cardamom"],
    heartNotes: ["Oud", "Leather", "Rose"],
    baseNotes: ["Amber", "Tonka Bean"],
    badge: "Extrait",
    featured: true,
    price: 349000,
  },
  {
    slug: "jasmine-veil",
    name: "Jasmine Veil",
    tagline: "White petals on warm skin",
    description:
      "Night-blooming jasmine sambac picked at dawn, wrapped in orange blossom and a whisper of creamy sandalwood. Luminous, clean and unmistakably elegant.",
    category: "floral",
    gender: "women",
    scentFamily: "White Floral",
    topNotes: ["Neroli", "Pear"],
    heartNotes: ["Jasmine Sambac", "Orange Blossom"],
    baseNotes: ["Sandalwood", "White Musk"],
    price: 239000,
  },
  {
    slug: "citrus-atlas",
    name: "Citrus Atlas",
    tagline: "Sunlit lemon groves",
    description:
      "A bright, sparkling cologne-style perfume. Sicilian lemon, mandarin and petitgrain over a breezy heart of neroli and a base of cedar. Made for hot days.",
    category: "fresh",
    gender: "unisex",
    scentFamily: "Citrus",
    topNotes: ["Lemon", "Mandarin", "Petitgrain"],
    heartNotes: ["Neroli", "Ginger"],
    baseNotes: ["Cedarwood", "Musk"],
    price: 189000,
    compareAt: 219000,
    badge: "Sale",
  },
  {
    slug: "santal-dusk",
    name: "Santal Dusk",
    tagline: "Creamy Mysore sandalwood",
    description:
      "Smooth, milky sandalwood with cardamom and a touch of fig. Comforting and quietly addictive — the perfume equivalent of cashmere.",
    category: "woody",
    gender: "unisex",
    scentFamily: "Woody",
    topNotes: ["Cardamom", "Fig Leaf"],
    heartNotes: ["Sandalwood", "Iris"],
    baseNotes: ["Cedarwood", "Vanilla", "Musk"],
    featured: true,
    price: 259000,
  },
  {
    slug: "blue-monsoon",
    name: "Blue Monsoon",
    tagline: "Sea salt and driftwood",
    description:
      "Cool, airy and a little salty. Sea spray and sage open onto lavender and driftwood, drying down to ambergris and soft woods.",
    category: "fresh",
    gender: "men",
    scentFamily: "Aquatic",
    topNotes: ["Sea Salt", "Sage"],
    heartNotes: ["Lavender", "Driftwood"],
    baseNotes: ["Ambergris", "Vetiver"],
    price: 209000,
  },
];

/** [step, name, description, family, colour, price add-on] */
export const seedBuilderOptions: [string, string, string, string | null, string | null, number][] = [
  ["size", "30 ml", "Perfect for trying a new signature.", null, null, 149000],
  ["size", "50 ml", "Our most popular size.", null, null, 219000],
  ["size", "100 ml", "For a scent you never want to run out of.", null, null, 349000],

  ["concentration", "Eau de Toilette", "Light and airy · lasts 3–4 hours.", null, null, 0],
  ["concentration", "Eau de Parfum", "Balanced and rich · lasts 6–8 hours.", null, null, 30000],
  ["concentration", "Extrait de Parfum", "Intense and intimate · lasts 10+ hours.", null, null, 70000],

  ["top", "Bergamot", "Sparkling, slightly bitter citrus.", "Citrus", "#f2d264", 0],
  ["top", "Lemon Zest", "Bright and mouth-watering.", "Citrus", "#f7e17a", 0],
  ["top", "Green Mandarin", "Juicy, sweet and green.", "Citrus", "#c9d86a", 0],
  ["top", "Pink Pepper", "Rosy spice with a fizz.", "Spicy", "#e8a2a0", 0],
  ["top", "Cardamom", "Cool, aromatic warmth.", "Spicy", "#cdbf8a", 0],
  ["top", "Sea Salt", "Fresh ocean air.", "Fresh", "#a9d0de", 0],

  ["heart", "Damask Rose", "Deep, velvety and classic.", "Floral", "#e58f9b", 0],
  ["heart", "Jasmine Sambac", "Lush white floral, slightly fruity.", "Floral", "#f3e8b8", 0],
  ["heart", "Orange Blossom", "Honeyed petals in sunshine.", "Floral", "#f6d9a0", 0],
  ["heart", "Lavender", "Clean, calming and herbal.", "Aromatic", "#b9a7d9", 0],
  ["heart", "Iris", "Powdery, cool and elegant.", "Powdery", "#c6c0e0", 20000],
  ["heart", "Tuberose", "Creamy, heady and bold.", "Floral", "#f4ead2", 20000],

  ["base", "Sandalwood", "Creamy, smooth wood.", "Woody", "#d1a878", 0],
  ["base", "Vetiver", "Earthy, smoky green roots.", "Woody", "#a8b077", 0],
  ["base", "Vanilla", "Warm, sweet and comforting.", "Gourmand", "#ecd3a1", 0],
  ["base", "White Musk", "Soft, clean second skin.", "Musk", "#ece6dc", 0],
  ["base", "Amber", "Golden, resinous warmth.", "Amber", "#d9963a", 0],
  ["base", "Patchouli", "Dark, earthy and rich.", "Woody", "#8a6a4a", 0],
  ["base", "Oud", "Rare, smoky and opulent.", "Oud", "#7a4a2b", 40000],

  ["finish", "Keepsake gift box", "Linen-wrapped box with a ribbon.", null, null, 19900],
  ["finish", "Travel atomiser 8 ml", "A refillable spray filled with your blend.", null, null, 34900],
];

export const seedReviews: [string, string, number, string, string][] = [
  ["noor", "Ananya R.", 5, "My new signature", "Warm without being heavy. I get asked what I'm wearing every single time."],
  ["noor", "Karthik M.", 4, "Lasts all day", "Lovely amber, lasts through a full workday. Wish the 30 ml came with a travel cap."],
  ["rosa-nocturne", "Meera S.", 5, "A grown-up rose", "Not a sweet rose at all — deep and a little mysterious. Beautiful bottle too."],
  ["oud-royale", "Imran K.", 5, "Proper oud", "Rich and smoky, but smooth. Two sprays is plenty."],
  ["vetiver-rain", "Dev P.", 5, "Smells like petrichor", "Exactly like the first rain. Fresh but not generic."],
  ["santal-dusk", "Sana T.", 4, "Cosy", "Creamy sandalwood, very comforting. Sits close to the skin."],
];

const s = (type: string, props: Record<string, unknown>) => createSection(type, props);

const policy = (title: string, body: string) => [s("richText", { title, body, spacing: "spacious" })];

export const seedPages: { slug: string; title: string; sections: SectionData[]; seoDescription?: string }[] = [
  {
    slug: "home",
    title: "Home",
    sections: [
      s("hero", {
        slides: [
          {
            image: DEMO_IMAGES.hero[0],
            eyebrow: "Bespoke perfumery",
            title: "A perfume composed only for you",
            subtitle:
              "Choose your notes, name your bottle and we blend it by hand in our atelier.",
            primaryLabel: "Create your perfume",
            primaryHref: "/create",
            secondaryLabel: "Shop the collection",
            secondaryHref: "/shop",
          },
          {
            image: DEMO_IMAGES.hero[1],
            eyebrow: "New arrival",
            title: "Vetiver Rain",
            subtitle: "Green roots, wet earth and the first monsoon shower.",
            primaryLabel: "Discover",
            primaryHref: "/product/vetiver-rain",
            secondaryLabel: "",
            secondaryHref: "",
          },
          {
            image: DEMO_IMAGES.hero[2],
            eyebrow: "The gift of scent",
            title: "Make it personal",
            subtitle: "Engrave a name, add a note, and send a perfume nobody else owns.",
            primaryLabel: "Start a gift",
            primaryHref: "/create",
            secondaryLabel: "",
            secondaryHref: "",
          },
        ],
        height: "tall",
        align: "left",
        tone: "light",
        overlay: "medium",
        autoplay: true,
      }),
      s("features", {
        items: [
          { icon: "flask", title: "Blended to order", text: "Every bottle is mixed after you order it." },
          { icon: "leaf", title: "Clean & cruelty free", text: "Vegan formulas, never tested on animals." },
          { icon: "truck", title: "Free shipping", text: "On all orders above ₹2,500." },
          { icon: "gift", title: "Gift ready", text: "Arrives in a linen keepsake box." },
        ],
        background: "default",
        spacing: "compact",
      }),
      s("products", {
        eyebrow: "The collection",
        title: "Signature perfumes",
        subtitle: "Ready-to-wear blends from our atelier, each matured for four weeks.",
        source: "featured",
        limit: 4,
        columns: "4",
        buttonLabel: "View all perfumes",
        buttonHref: "/shop",
      }),
      s("builder", {
        image: DEMO_IMAGES.builder,
        eyebrow: "Made for one",
        title: "Create your own perfume",
        subtitle:
          "Our perfumers turn your choices into a balanced, wearable fragrance — and no two are alike.",
        steps: [
          { title: "Choose your notes", text: "Layer top, heart and base notes from over twenty essences." },
          { title: "Name your bottle", text: "We print your words on the label — a name, a date, a secret." },
          { title: "We blend it by hand", text: "Made to order in 5–7 days and delivered to your door." },
        ],
        buttonLabel: "Start creating",
        buttonHref: "/create",
        background: "surface",
      }),
      s("categories", {
        eyebrow: "Explore",
        title: "Shop by scent family",
        subtitle: "",
      }),
      s("marquee", {
        items: ["Hand-blended in small batches", "Vegan & cruelty free", "Made to order", "Refillable bottles"],
        background: "dark",
      }),
      s("split", {
        image: DEMO_IMAGES.atelier,
        imageSide: "right",
        eyebrow: "Our atelier",
        title: "Slow perfumery, made by hand",
        body: "We started with a simple idea: a perfume should feel like it was made for the person wearing it.\n\nEvery blend is weighed, mixed and bottled by hand, then left to mature before it reaches you. No shortcuts, no mass production.",
        buttonLabel: "Read our story",
        buttonHref: "/about",
      }),
      s("testimonials", {
        eyebrow: "Kind words",
        title: "Loved by those who wear it",
        items: [
          { quote: "I designed a perfume for my wedding day. Opening that bottle still takes me straight back.", author: "Priya N.", detail: "Bespoke blend" },
          { quote: "Finally a rose that isn't sugary. I've stopped buying anything else.", author: "Meera S.", detail: "Rosa Nocturne" },
          { quote: "The quality is on par with niche houses that charge three times as much.", author: "Arjun V.", detail: "Oud Royale" },
        ],
        background: "surface",
      }),
      s("newsletter", {
        title: "Join the atelier list",
        subtitle: "New blends, limited batches and private offers — a few emails a year.",
        buttonLabel: "Subscribe",
        background: "default",
      }),
    ],
  },
  {
    slug: "about",
    title: "Our story",
    seoDescription: "The people and process behind our made-to-order perfumes.",
    sections: [
      s("banner", {
        image: DEMO_IMAGES.banner,
        eyebrow: "Our story",
        title: "Perfume, made slowly",
        subtitle: "A small atelier with a simple belief: scent is personal.",
        buttonLabel: "",
        buttonHref: "",
        tone: "light",
      }),
      s("split", {
        image: DEMO_IMAGES.atelier,
        imageSide: "left",
        eyebrow: "The beginning",
        title: "From a kitchen table to an atelier",
        body: "What began as weekend experiments with a handful of essential oils became a full-time obsession.\n\nToday we work with growers and distillers we know by name, and every bottle is still blended by hand.",
      }),
      s("features", {
        items: [
          { icon: "droplet", title: "Honest ingredients", text: "High-concentration oils, no fillers." },
          { icon: "recycle", title: "Refill, don't replace", text: "Send your bottle back for a refill at a lower price." },
          { icon: "heart", title: "Made with care", text: "Small batches, quality-checked by a perfumer." },
        ],
        background: "surface",
      }),
      s("builder", {}),
    ],
  },
  {
    slug: "contact",
    title: "Contact",
    seoDescription: "Questions about an order or a custom blend? Write to us.",
    sections: [s("contact", { spacing: "spacious" })],
  },
  {
    slug: "faq",
    title: "FAQ",
    sections: [
      s("faq", {
        title: "Frequently asked questions",
        subtitle: "Can't find your answer? Write to us from the contact page.",
        spacing: "spacious",
        items: [
          { question: "How long does a custom perfume take?", answer: "Bespoke blends are mixed after you order and need a few days to settle. They ship within 5–7 working days." },
          { question: "How long do your perfumes last?", answer: "Eau de Parfum lasts 6–8 hours on most skin. Extrait de Parfum lasts 10 hours or more." },
          { question: "Can I return a perfume?", answer: "Unopened signature perfumes can be returned within 7 days. Custom blends are made for you and can't be returned, but we'll rebalance a blend once for free if you're not happy." },
          { question: "Are your perfumes vegan?", answer: "Yes. All of our formulas are vegan and we never test on animals." },
          { question: "Do you ship internationally?", answer: "At the moment we ship within India only." },
        ],
      }),
    ],
  },
  {
    slug: "shipping-returns",
    title: "Shipping & returns",
    sections: policy(
      "Shipping & returns",
      "## Shipping\n\nSignature perfumes are dispatched within 2 working days. Custom blends are made to order and dispatched within 5–7 working days.\n\n- Shipping is free above the threshold shown at checkout.\n- You'll receive a tracking number as soon as your parcel leaves the atelier.\n\n## Returns\n\nUnopened signature perfumes may be returned within 7 days of delivery for a full refund.\n\nCustom perfumes are made specially for you and cannot be returned. If your blend isn't right, contact us and we'll rebalance it once at no charge.\n\n## Damaged in transit\n\nSend us a photo within 48 hours of delivery and we'll replace it.",
    ),
  },
  {
    slug: "privacy",
    title: "Privacy policy",
    sections: policy(
      "Privacy policy",
      "*Replace this placeholder with your own policy before going live.*\n\n## What we collect\n\nWe collect the details you give us at checkout — your name, email, phone number and delivery address — so we can deliver your order.\n\n## How we use it\n\n- To process and deliver orders.\n- To answer your messages.\n- To send our newsletter, only if you subscribe.\n\nWe never sell your data.\n\n## Your rights\n\nWrite to us at any time to see, correct or delete the information we hold about you.",
    ),
  },
  {
    slug: "terms",
    title: "Terms of service",
    sections: policy(
      "Terms of service",
      "*Replace this placeholder with your own terms before going live.*\n\n## Orders\n\nPlacing an order is an offer to buy. We confirm the order by email or message once it is accepted.\n\n## Pricing\n\nPrices are shown in the store currency and include applicable taxes unless stated otherwise.\n\n## Custom products\n\nBespoke perfumes are made to your specification and are non-refundable once blending has begun.",
    ),
  },
];
