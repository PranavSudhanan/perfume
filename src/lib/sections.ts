import type { SectionData } from "@/db/schema";
import { DEMO_IMAGES } from "./demo-images";
import type { Field } from "./fields";
import { uid } from "./utils";

export type SectionDef = {
  type: string;
  label: string;
  description: string;
  fields: Field[];
  defaults: Record<string, unknown>;
};

export const FEATURE_ICONS = [
  "sparkles",
  "leaf",
  "droplet",
  "flask",
  "gift",
  "truck",
  "shield",
  "heart",
  "award",
  "clock",
  "recycle",
  "gem",
  "package",
  "feather",
] as const;

const background: Field = {
  name: "background",
  label: "Background",
  type: "select",
  half: true,
  options: [
    { value: "default", label: "Page background" },
    { value: "surface", label: "Soft surface" },
    { value: "dark", label: "Dark (text colour)" },
    { value: "primary", label: "Primary colour" },
  ],
};

const spacing: Field = {
  name: "spacing",
  label: "Vertical spacing",
  type: "select",
  half: true,
  options: [
    { value: "compact", label: "Compact" },
    { value: "normal", label: "Normal" },
    { value: "spacious", label: "Spacious" },
  ],
};

const heading: Field[] = [
  { name: "eyebrow", label: "Eyebrow", type: "text", placeholder: "Small label above the title" },
  { name: "title", label: "Title", type: "text" },
  { name: "subtitle", label: "Subtitle", type: "textarea" },
];

const style = { background: "default", spacing: "normal" };

export const SECTION_DEFS: SectionDef[] = [
  {
    type: "hero",
    label: "Hero banner",
    description: "Full-width banner slides with headline and buttons.",
    fields: [
      {
        name: "slides",
        label: "Slides",
        type: "list",
        itemLabel: "Slide",
        titleField: "title",
        fields: [
          { name: "image", label: "Background image", type: "image" },
          { name: "eyebrow", label: "Eyebrow", type: "text" },
          { name: "title", label: "Headline", type: "text" },
          { name: "subtitle", label: "Text", type: "textarea" },
          { name: "primaryLabel", label: "Button label", type: "text", half: true },
          { name: "primaryHref", label: "Button link", type: "link", half: true },
          { name: "secondaryLabel", label: "Second button label", type: "text", half: true },
          { name: "secondaryHref", label: "Second button link", type: "link", half: true },
        ],
      },
      {
        name: "height",
        label: "Height",
        type: "select",
        half: true,
        options: [
          { value: "medium", label: "Medium" },
          { value: "tall", label: "Tall" },
          { value: "full", label: "Full screen" },
        ],
      },
      {
        name: "align",
        label: "Text position",
        type: "select",
        half: true,
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Centre" },
        ],
      },
      {
        name: "tone",
        label: "Text colour",
        type: "select",
        half: true,
        options: [
          { value: "light", label: "Light text (dark image)" },
          { value: "dark", label: "Dark text (light image)" },
        ],
      },
      {
        name: "overlay",
        label: "Image overlay",
        type: "select",
        half: true,
        options: [
          { value: "none", label: "None" },
          { value: "light", label: "Light" },
          { value: "medium", label: "Medium" },
          { value: "strong", label: "Strong" },
        ],
      },
      { name: "autoplay", label: "Rotate slides automatically", type: "boolean" },
    ],
    defaults: {
      slides: [
        {
          image: DEMO_IMAGES.hero[0],
          eyebrow: "New",
          title: "Your headline here",
          subtitle: "A short supporting line.",
          primaryLabel: "Shop now",
          primaryHref: "/shop",
          secondaryLabel: "",
          secondaryHref: "",
        },
      ],
      height: "tall",
      align: "left",
      tone: "light",
      overlay: "medium",
      autoplay: true,
    },
  },
  {
    type: "marquee",
    label: "Scrolling text strip",
    description: "A moving line of short phrases.",
    fields: [{ name: "items", label: "Phrases", type: "tags" }, background],
    defaults: { items: ["Made to order", "Cruelty free", "Blended by hand"], background: "dark" },
  },
  {
    type: "products",
    label: "Product grid",
    description: "A row of products: featured, newest, or from one collection.",
    fields: [
      ...heading,
      {
        name: "source",
        label: "Show",
        type: "select",
        half: true,
        options: [
          { value: "featured", label: "Featured products" },
          { value: "newest", label: "Newest products" },
          { value: "category", label: "One collection" },
        ],
      },
      {
        name: "categoryId",
        label: "Collection",
        type: "select",
        source: "categories",
        allowEmpty: "Any",
        half: true,
        help: "Used when “One collection” is selected.",
      },
      { name: "limit", label: "How many", type: "number", half: true },
      {
        name: "columns",
        label: "Columns",
        type: "select",
        half: true,
        options: [
          { value: "3", label: "3" },
          { value: "4", label: "4" },
        ],
      },
      { name: "buttonLabel", label: "Button label", type: "text", half: true },
      { name: "buttonHref", label: "Button link", type: "link", half: true },
      background,
      spacing,
    ],
    defaults: {
      eyebrow: "The collection",
      title: "Signature perfumes",
      subtitle: "",
      source: "featured",
      categoryId: "",
      limit: 4,
      columns: "4",
      buttonLabel: "View all",
      buttonHref: "/shop",
      ...style,
    },
  },
  {
    type: "categories",
    label: "Collections",
    description: "Tiles linking to each collection.",
    fields: [...heading, background, spacing],
    defaults: { eyebrow: "Explore", title: "Shop by collection", subtitle: "", ...style },
  },
  {
    type: "split",
    label: "Image with text",
    description: "An image beside a block of text and a button.",
    fields: [
      { name: "image", label: "Image", type: "image" },
      {
        name: "imageSide",
        label: "Image position",
        type: "select",
        options: [
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
        ],
      },
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Text", type: "markdown" },
      { name: "buttonLabel", label: "Button label", type: "text", half: true },
      { name: "buttonHref", label: "Button link", type: "link", half: true },
      background,
      spacing,
    ],
    defaults: {
      image: DEMO_IMAGES.atelier,
      imageSide: "left",
      eyebrow: "",
      title: "Tell your story",
      body: "Write a few sentences about your brand.",
      buttonLabel: "",
      buttonHref: "",
      ...style,
    },
  },
  {
    type: "builder",
    label: "Custom perfume promo",
    description: "Promotes the build-your-own perfume experience with numbered steps.",
    fields: [
      { name: "image", label: "Image", type: "image" },
      ...heading,
      {
        name: "steps",
        label: "Steps",
        type: "list",
        itemLabel: "Step",
        titleField: "title",
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "text", label: "Text", type: "textarea" },
        ],
      },
      { name: "buttonLabel", label: "Button label", type: "text", half: true },
      { name: "buttonHref", label: "Button link", type: "link", half: true },
      background,
      spacing,
    ],
    defaults: {
      image: DEMO_IMAGES.builder,
      eyebrow: "Made for one",
      title: "Create your own perfume",
      subtitle: "Three steps to a fragrance nobody else has.",
      steps: [
        { title: "Choose your notes", text: "Layer top, heart and base notes." },
        { title: "Name your bottle", text: "We print your words on the label." },
        { title: "We blend it by hand", text: "Made to order and shipped to you." },
      ],
      buttonLabel: "Start creating",
      buttonHref: "/create",
      background: "surface",
      spacing: "normal",
    },
  },
  {
    type: "features",
    label: "Highlights",
    description: "A row of icons with short selling points.",
    fields: [
      {
        name: "items",
        label: "Highlights",
        type: "list",
        itemLabel: "Highlight",
        titleField: "title",
        fields: [
          {
            name: "icon",
            label: "Icon",
            type: "select",
            options: FEATURE_ICONS.map((i) => ({ value: i, label: i[0].toUpperCase() + i.slice(1) })),
          },
          { name: "title", label: "Title", type: "text" },
          { name: "text", label: "Text", type: "textarea" },
        ],
      },
      background,
      spacing,
    ],
    defaults: {
      items: [
        { icon: "flask", title: "Blended to order", text: "Each bottle is made after you order." },
        { icon: "leaf", title: "Clean ingredients", text: "Vegan and cruelty free." },
        { icon: "truck", title: "Free shipping", text: "On orders above a set value." },
        { icon: "gift", title: "Gift ready", text: "Arrives in a keepsake box." },
      ],
      background: "default",
      spacing: "compact",
    },
  },
  {
    type: "testimonials",
    label: "Testimonials",
    description: "Quotes from customers.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      {
        name: "items",
        label: "Quotes",
        type: "list",
        itemLabel: "Quote",
        titleField: "author",
        fields: [
          { name: "quote", label: "Quote", type: "textarea" },
          { name: "author", label: "Name", type: "text", half: true },
          { name: "detail", label: "Detail", type: "text", half: true, placeholder: "City, product…" },
        ],
      },
      background,
      spacing,
    ],
    defaults: {
      eyebrow: "Kind words",
      title: "Loved by our customers",
      items: [{ quote: "A wonderful perfume.", author: "Customer name", detail: "City" }],
      ...style,
    },
  },
  {
    type: "richText",
    label: "Text block",
    description: "Headings, paragraphs, lists and links. Ideal for policies.",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Content", type: "markdown" },
      {
        name: "align",
        label: "Alignment",
        type: "select",
        half: true,
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Centre" },
        ],
      },
      background,
      spacing,
    ],
    defaults: { title: "Title", body: "Write your content here.", align: "left", ...style },
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Expandable questions and answers.",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "subtitle", label: "Subtitle", type: "textarea" },
      {
        name: "items",
        label: "Questions",
        type: "list",
        itemLabel: "Question",
        titleField: "question",
        fields: [
          { name: "question", label: "Question", type: "text" },
          { name: "answer", label: "Answer", type: "markdown" },
        ],
      },
      background,
      spacing,
    ],
    defaults: {
      title: "Frequently asked questions",
      subtitle: "",
      items: [{ question: "A question?", answer: "The answer." }],
      ...style,
    },
  },
  {
    type: "banner",
    label: "Promo banner",
    description: "A wide image banner with a message and button.",
    fields: [
      { name: "image", label: "Background image", type: "image" },
      ...heading,
      { name: "buttonLabel", label: "Button label", type: "text", half: true },
      { name: "buttonHref", label: "Button link", type: "link", half: true },
      {
        name: "tone",
        label: "Text colour",
        type: "select",
        options: [
          { value: "light", label: "Light text (dark image)" },
          { value: "dark", label: "Dark text (light image)" },
        ],
      },
    ],
    defaults: {
      image: DEMO_IMAGES.banner,
      eyebrow: "Limited",
      title: "A seasonal offer",
      subtitle: "Describe the promotion in a sentence.",
      buttonLabel: "Shop the offer",
      buttonHref: "/shop",
      tone: "light",
    },
  },
  {
    type: "gallery",
    label: "Image gallery",
    description: "A grid of images.",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "images", label: "Images", type: "images" },
      {
        name: "columns",
        label: "Columns",
        type: "select",
        half: true,
        options: [
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4", label: "4" },
        ],
      },
      background,
      spacing,
    ],
    defaults: { title: "", images: [], columns: "3", ...style },
  },
  {
    type: "newsletter",
    label: "Newsletter signup",
    description: "Email signup form.",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "subtitle", label: "Subtitle", type: "textarea" },
      { name: "buttonLabel", label: "Button label", type: "text" },
      background,
      spacing,
    ],
    defaults: {
      title: "Join the list",
      subtitle: "New blends and private offers, a few times a year.",
      buttonLabel: "Subscribe",
      background: "surface",
      spacing: "normal",
    },
  },
  {
    type: "contact",
    label: "Contact form",
    description: "A message form next to your store details.",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "subtitle", label: "Subtitle", type: "textarea" },
      { name: "showDetails", label: "Show store email, phone and address", type: "boolean" },
      background,
      spacing,
    ],
    defaults: {
      title: "Get in touch",
      subtitle: "We usually reply within one working day.",
      showDetails: true,
      ...style,
    },
  },
];

export const SECTION_MAP: Record<string, SectionDef> = Object.fromEntries(
  SECTION_DEFS.map((d) => [d.type, d]),
);

export function createSection(type: string, props: Record<string, unknown> = {}): SectionData {
  const def = SECTION_MAP[type];
  return {
    id: uid(),
    type,
    enabled: true,
    props: { ...structuredClone(def?.defaults ?? {}), ...props },
  };
}
