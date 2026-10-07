import type { Field } from "./fields";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "./utils";

/** Form definitions for the admin panel. Rendered by components/admin/fields.tsx. */

type Group = { title?: string; description?: string; fields: Field[] };

const capitalise = (s: string) => s[0].toUpperCase() + s.slice(1);

const seoGroup: Group = {
  title: "Search engines",
  description: "Optional. Leave empty to use the name and description above.",
  fields: [
    { name: "seoTitle", label: "Page title", type: "text" },
    { name: "seoDescription", label: "Meta description", type: "textarea" },
  ],
};

export const productGroups: Group[] = [
  {
    title: "Product",
    fields: [
      { name: "name", label: "Name", type: "text" },
      { name: "slug", label: "URL slug", type: "text", help: "Appears in the address: /product/your-slug" },
      { name: "tagline", label: "Tagline", type: "text", placeholder: "A short line shown under the name" },
      { name: "description", label: "Description", type: "markdown" },
      { name: "categoryId", label: "Collection", type: "select", source: "categories", allowEmpty: "None", half: true },
      { name: "badge", label: "Badge", type: "text", placeholder: "New, Bestseller…", half: true },
    ],
  },
  {
    title: "Images",
    description: "The first image is the main one; the second appears on hover in listings.",
    fields: [{ name: "images", label: "Product images", type: "images" }],
  },
  {
    title: "Sizes, prices & stock",
    description: "Each size is sold and stocked separately.",
    fields: [
      {
        name: "variants",
        label: "Sizes",
        type: "list",
        itemLabel: "Size",
        titleField: "label",
        fields: [
          { name: "label", label: "Label", type: "text", placeholder: "50 ml", half: true },
          { name: "sku", label: "SKU", type: "text", half: true },
          { name: "price", label: "Price", type: "money", half: true },
          {
            name: "compareAtPrice",
            label: "Compare-at price",
            type: "money",
            half: true,
            help: "Optional original price, shown struck through.",
          },
          { name: "stock", label: "Units in stock", type: "number", half: true },
        ],
      },
    ],
  },
  {
    title: "Fragrance",
    fields: [
      {
        name: "gender",
        label: "Made for",
        type: "select",
        half: true,
        options: [
          { value: "unisex", label: "Unisex" },
          { value: "women", label: "Women" },
          { value: "men", label: "Men" },
        ],
      },
      { name: "concentration", label: "Concentration", type: "text", placeholder: "Eau de Parfum", half: true },
      { name: "scentFamily", label: "Scent family", type: "text", placeholder: "Floral, Woody…", half: true },
      { name: "topNotes", label: "Top notes", type: "tags" },
      { name: "heartNotes", label: "Heart notes", type: "tags" },
      { name: "baseNotes", label: "Base notes", type: "tags" },
    ],
  },
  {
    title: "Visibility",
    fields: [
      { name: "active", label: "Visible in the store", type: "boolean" },
      { name: "featured", label: "Featured (shown in “Featured products” sections)", type: "boolean" },
    ],
  },
  seoGroup,
];

export const categoryFields: Field[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "slug", label: "URL slug", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "image", label: "Image", type: "image" },
  { name: "sortOrder", label: "Sort order", type: "number", half: true, help: "Lower numbers appear first." },
  { name: "active", label: "Visible in the store", type: "boolean" },
];

export const couponFields: Field[] = [
  { name: "code", label: "Code", type: "text", placeholder: "WELCOME10" },
  {
    name: "type",
    label: "Discount type",
    type: "select",
    options: [
      { value: "percent", label: "Percentage off" },
      { value: "fixed", label: "Fixed amount off" },
    ],
  },
  { name: "percentOff", label: "Percent off", type: "number", half: true, help: "Used for percentage codes." },
  { name: "amountOff", label: "Amount off", type: "money", half: true, help: "Used for fixed-amount codes." },
  { name: "minSubtotal", label: "Minimum order value", type: "money", half: true },
  { name: "maxUses", label: "Usage limit", type: "number", half: true, help: "0 means unlimited." },
  { name: "expiresAt", label: "Expires", type: "datetime", help: "Leave empty for no expiry." },
  { name: "active", label: "Active", type: "boolean" },
];

export const builderOptionFields: Field[] = [
  { name: "step", label: "Step", type: "select", source: "steps" },
  { name: "name", label: "Name", type: "text" },
  { name: "description", label: "Description", type: "text" },
  { name: "family", label: "Scent family", type: "text", half: true, help: "Feeds the scent profile, e.g. Floral." },
  { name: "color", label: "Liquid tint", type: "color", half: true, help: "Tints the bottle preview." },
  { name: "priceDelta", label: "Price", type: "money", half: true, help: "Added to the perfume price. 0 = included." },
  { name: "sortOrder", label: "Sort order", type: "number", half: true },
  { name: "image", label: "Image (optional)", type: "image" },
  { name: "active", label: "Available", type: "boolean" },
];

export const builderGroups: Group[] = [
  {
    title: "Experience",
    fields: [
      { name: "enabled", label: "Offer custom perfumes", type: "boolean" },
      { name: "productName", label: "Product name", type: "text", help: "How a custom perfume appears in the bag and on orders." },
      { name: "title", label: "Page title", type: "text" },
      { name: "subtitle", label: "Page introduction", type: "textarea" },
      { name: "basePrice", label: "Base price", type: "money", half: true, help: "Added before any options. Often 0 when sizes carry the price." },
      { name: "leadTime", label: "Lead-time note", type: "text", half: true },
    ],
  },
  {
    title: "Steps",
    description:
      "The stages a customer goes through. Add options to each step in the table below. A step with key “size” supplies the size shown in the bag.",
    fields: [
      {
        name: "steps",
        label: "Steps",
        type: "list",
        itemLabel: "Step",
        titleField: "title",
        fields: [
          { name: "title", label: "Title", type: "text", half: true },
          { name: "key", label: "Key", type: "text", half: true, help: "Short id, e.g. top. Don’t change once options exist." },
          { name: "subtitle", label: "Helper text", type: "text" },
          { name: "min", label: "Minimum choices", type: "number", half: true },
          { name: "max", label: "Maximum choices", type: "number", half: true },
        ],
      },
    ],
  },
  {
    title: "Personalisation",
    fields: [
      { name: "labelEnabled", label: "Let customers name their perfume (printed on the label)", type: "boolean" },
      { name: "labelMaxChars", label: "Maximum characters", type: "number", half: true },
      { name: "labelPrice", label: "Extra charge for a custom label", type: "money", half: true },
      { name: "giftMessageEnabled", label: "Offer a gift message", type: "boolean" },
    ],
  },
];

export const orderGroups: Group[] = [
  {
    title: "Fulfilment",
    fields: [
      {
        name: "status",
        label: "Order status",
        type: "select",
        half: true,
        options: ORDER_STATUSES.map((s) => ({ value: s, label: capitalise(s) })),
        help: "Cancelling returns the items to stock.",
      },
      {
        name: "paymentStatus",
        label: "Payment status",
        type: "select",
        half: true,
        options: PAYMENT_STATUSES.map((s) => ({ value: s, label: capitalise(s) })),
      },
      { name: "trackingNumber", label: "Tracking number", type: "text", half: true },
      { name: "trackingUrl", label: "Tracking link", type: "text", half: true, placeholder: "https://…" },
      { name: "adminNote", label: "Internal note", type: "textarea", help: "Only visible to admins." },
    ],
  },
];

const linkFields: Field[] = [
  { name: "label", label: "Label", type: "text", half: true },
  { name: "href", label: "Link", type: "link", half: true },
];

export const navigationGroups: Group[] = [
  {
    title: "Announcement bar",
    description: "The thin strip at the very top of every page.",
    fields: [
      { name: "announcementEnabled", label: "Show the announcement bar", type: "boolean" },
      { name: "announcements", label: "Messages", type: "tags", help: "Several messages rotate automatically." },
      { name: "announcementHref", label: "Link when clicked", type: "link" },
    ],
  },
  {
    title: "Header menu",
    fields: [{ name: "header", label: "Menu links", type: "list", itemLabel: "Link", titleField: "label", fields: linkFields }],
  },
  {
    title: "Footer",
    fields: [
      { name: "footerAbout", label: "About text", type: "textarea" },
      {
        name: "footerColumns",
        label: "Link columns",
        type: "list",
        itemLabel: "Column",
        titleField: "title",
        fields: [
          { name: "title", label: "Column title", type: "text" },
          { name: "links", label: "Links", type: "list", itemLabel: "Link", titleField: "label", fields: linkFields },
        ],
      },
      { name: "footerNewsletter", label: "Show newsletter signup", type: "boolean" },
      { name: "copyright", label: "Copyright line", type: "text" },
    ],
  },
];

export const storeGroups: Group[] = [
  {
    title: "Brand",
    fields: [
      {
        name: "name",
        label: "Store name",
        type: "text",
        half: true,
        help: "Shown in the header, footer, browser tab, emails and text messages.",
      },
      { name: "tagline", label: "Tagline", type: "text", half: true },
      { name: "logo", label: "Logo", type: "image", help: "Optional. Without a logo the store name is shown as text." },
    ],
  },
  {
    title: "Contact details",
    description: "Shown in the footer and on the contact page.",
    fields: [
      { name: "email", label: "Email", type: "text", half: true },
      { name: "phone", label: "Phone", type: "text", half: true },
      { name: "address", label: "Address", type: "text" },
    ],
  },
  {
    title: "Social links",
    fields: [
      { name: "instagram", label: "Instagram URL", type: "text", half: true },
      { name: "facebook", label: "Facebook URL", type: "text", half: true },
      { name: "youtube", label: "YouTube URL", type: "text", half: true },
      { name: "whatsapp", label: "WhatsApp number", type: "text", half: true, placeholder: "+91 90000 00000" },
    ],
  },
  {
    title: "Currency",
    description: "Changing the currency relabels existing prices — it does not convert them.",
    fields: [
      { name: "currencyCode", label: "Currency code", type: "text", half: true, placeholder: "INR" },
      { name: "locale", label: "Number format", type: "text", half: true, placeholder: "en-IN" },
    ],
  },
  {
    title: "Search & sharing",
    fields: [
      { name: "seoTitle", label: "Home page title", type: "text" },
      { name: "seoDescription", label: "Site description", type: "textarea" },
      { name: "socialImage", label: "Sharing image", type: "image", help: "Shown when the site is shared on social media." },
    ],
  },
];

export const checkoutGroups: Group[] = [
  {
    title: "Shipping & tax",
    fields: [
      { name: "shippingFlat", label: "Shipping fee", type: "money", half: true },
      { name: "freeShippingAbove", label: "Free shipping above", type: "money", half: true, help: "0 turns free shipping off." },
      { name: "taxPercent", label: "Tax added at checkout (%)", type: "number", half: true, help: "Use 0 if your prices already include tax." },
      {
        name: "shipCountries",
        label: "Countries you deliver to",
        type: "multiselect",
        source: "countries",
        addLabel: "Add a country…",
        help: "Customers can only choose these at checkout. The first one is preselected.",
      },
    ],
  },
  {
    title: "Payments",
    fields: [
      { name: "codEnabled", label: "Accept cash on delivery", type: "boolean" },
      {
        name: "onlineEnabled",
        label: "Accept online payments (Razorpay)",
        type: "boolean",
        help: "Also requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables.",
      },
    ],
  },
  {
    title: "Orders",
    fields: [
      { name: "orderPrefix", label: "Order number prefix", type: "text", half: true, placeholder: "AU" },
      { name: "checkoutNote", label: "Note shown at checkout and on product pages", type: "textarea" },
    ],
  },
  {
    title: "Emails and texts to customers",
    description:
      "The confirmation goes out as soon as an order is placed (or paid, for online payments). Shipping updates go out when you change an order's status.",
    fields: [
      { name: "confirmationEmail", label: "Send a confirmation email", type: "boolean" },
      { name: "emailNote", label: "Extra line in the email", type: "textarea", help: "Appears under the greeting. Leave empty for none." },
      {
        name: "shippingEmail",
        label: "Send shipping update emails",
        type: "boolean",
        help: "One email when you mark an order as shipped (with its tracking details), and one when you mark it as delivered.",
      },
      { name: "confirmationSms", label: "Send a confirmation text message (SMS)", type: "boolean" },
      {
        name: "smsTemplate",
        label: "Text message",
        type: "textarea",
        help: "Placeholders: {store} {name} {order} {total} {link}. Keep it short; long messages are billed as several.",
      },
    ],
  },
];
