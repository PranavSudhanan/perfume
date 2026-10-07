import type { Order, OrderItem } from "@/db/schema";
import type { SiteSettings } from "@/lib/config";
import { formatMoney, safeHref } from "@/lib/utils";

/**
 * Every email the store sends is built here: order confirmation, shipping
 * updates and password reset. Each returns a subject, an HTML body and a
 * plain-text alternative.
 */
export type EmailContent = { subject: string; html: string; text: string };

type OrderWithItems = Order & { items: OrderItem[] };

const HEX = /^#[0-9a-f]{6}$/i;
const MUTED = "color:#6f665a;";
const PARAGRAPH = "margin:0 0 10px;font-size:15px;line-height:24px;";

/** Customer-entered text (names, gift notes) must never be read as markup by a mail client. */
function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

export function orderUrl(baseUrl: string, orderId: string) {
  return `${baseUrl}/order/${orderId}`;
}

/** The shared frame: store name on top, a heading, the message, an optional button, contact details below. */
function layout(
  settings: SiteSettings,
  parts: {
    title: string;
    preheader: string;
    eyebrow: string;
    heading: string;
    /** Paragraphs of plain text; muted ones are shown in grey. */
    paragraphs: (string | { muted: string })[];
    button?: { label: string; href: string };
    /** Extra pre-built HTML rows (already escaped) placed under the button. */
    rows?: string;
    footer: string;
  },
) {
  const { store, theme } = settings;
  const buttonColor = HEX.test(theme.colors.primary) ? theme.colors.primary : "#1f1b16";
  const buttonText = HEX.test(theme.colors.primaryText) ? theme.colors.primaryText : "#ffffff";
  const accent = HEX.test(theme.colors.accent) ? theme.colors.accent : "#a07a35";
  const contact = [store.email, store.phone].filter(Boolean).map(esc).join(" · ");

  const paragraphs = parts.paragraphs
    .filter((p) => (typeof p === "string" ? p : p.muted))
    .map((p) =>
      typeof p === "string"
        ? `<p style="${PARAGRAPH}">${esc(p)}</p>`
        : `<p style="${PARAGRAPH}${MUTED}">${esc(p.muted)}</p>`,
    )
    .join("\n      ");

  const button = parts.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 8px;"><tr>
        <td style="background:${buttonColor};"><a href="${esc(parts.button.href)}" style="display:inline-block;padding:14px 28px;font-size:13px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;color:${buttonText};">${esc(parts.button.label)}</a></td>
      </tr></table>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(parts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f1ec;font-family:Arial,Helvetica,sans-serif;color:#1f1b16;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(parts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;">
    <tr><td align="center" style="padding:28px 32px;border-bottom:1px solid #eee8de;font-family:Georgia,'Times New Roman',serif;font-size:24px;letter-spacing:5px;text-transform:uppercase;">${esc(store.name)}</td></tr>
    <tr><td style="padding:36px 32px ${parts.rows ? "8px" : "32px"};">
      <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${accent};">${esc(parts.eyebrow)}</div>
      <h1 style="margin:10px 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:36px;font-weight:normal;">${esc(parts.heading)}</h1>
      ${paragraphs}
      ${button}
    </td></tr>
    ${parts.rows ?? ""}
    <tr><td align="center" style="padding:22px 32px;background:#faf7f2;font-size:12px;line-height:19px;${MUTED}">
      ${esc(parts.footer)}<br>
      ${contact}${contact ? "<br>" : ""}${esc(store.address)}
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

/** Joins lines into a plain-text email, dropping empties and collapsing blank runs. */
function plainText(lines: (string | false | null | undefined)[]) {
  return lines
    .filter((line): line is string => typeof line === "string")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function customLines(item: OrderItem) {
  if (!item.custom) return [];
  const lines = item.custom.selections.map((s) => `${s.title}: ${s.options.join(", ")}`);
  if (item.custom.labelText) lines.push(`Label: “${item.custom.labelText}”`);
  if (item.custom.giftMessage) lines.push(`Gift note: “${item.custom.giftMessage}”`);
  return lines;
}

function addressLines(order: Order) {
  const a = order.shippingAddress;
  return [
    order.name,
    a.line1,
    a.line2,
    `${a.city}, ${a.state} ${a.postalCode}`,
    a.country,
    order.phone,
  ].filter(Boolean) as string[];
}

function addressRow(order: Order) {
  return `<tr><td style="padding:28px 32px 32px;">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;${MUTED}">Delivering to</div>
      <div style="margin-top:8px;font-size:14px;line-height:22px;">${addressLines(order).map(esc).join("<br>")}</div>
    </td></tr>`;
}

/** The list of items, with prices when `money` is given. */
function itemsRow(order: OrderWithItems, money?: (minor: number) => string) {
  const cell = "padding:14px 0;border-bottom:1px solid #eee8de;vertical-align:top;";
  const rows = order.items
    .map((item) => {
      const details = [item.variantLabel, ...customLines(item)].filter(Boolean) as string[];
      const quantity = money ? `Qty ${item.quantity} × ${money(item.unitPrice)}` : `Qty ${item.quantity}`;
      return `<tr>
        <td style="${cell}">
          <div style="font-size:15px;font-weight:bold;">${esc(item.name)}</div>
          ${details.map((d) => `<div style="font-size:13px;line-height:19px;${MUTED}">${esc(d)}</div>`).join("")}
          <div style="font-size:13px;line-height:19px;${MUTED}">${esc(quantity)}</div>
        </td>
        ${money ? `<td align="right" style="${cell}font-size:15px;white-space:nowrap;padding-left:16px;">${esc(money(item.unitPrice * item.quantity))}</td>` : ""}
      </tr>`;
    })
    .join("");
  return `<tr><td style="padding:16px 32px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee8de;">${rows}</table>
    </td></tr>`;
}

/** Sent when an order is placed (cash on delivery) or paid (online). */
export function orderEmail(order: OrderWithItems, settings: SiteSettings, baseUrl: string): EmailContent {
  const { store, checkout } = settings;
  const money = (minor: number) => formatMoney(minor, store);
  const link = orderUrl(baseUrl, order.id);
  const name = firstName(order.name);
  const total = money(order.total);
  const received = `We have received your order ${order.orderNumber} and are getting it ready.`;
  const payment =
    order.paymentMethod === "cod"
      ? `Please keep ${total} ready to pay in cash on delivery.`
      : order.paymentStatus === "paid"
        ? `We have received your payment of ${total}.`
        : "";
  const note = checkout.emailNote.trim();

  const totals: [string, string][] = [["Subtotal", money(order.subtotal)]];
  if (order.discount > 0) {
    totals.push([`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`, `−${money(order.discount)}`]);
  }
  totals.push(["Shipping", order.shipping ? money(order.shipping) : "Free"]);
  if (order.tax > 0) totals.push(["Tax", money(order.tax)]);

  const totalsRow = `<tr><td style="padding:14px 32px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${totals.map(([label, value]) => `<tr><td style="padding:4px 0;font-size:14px;${MUTED}">${esc(label)}</td><td align="right" style="padding:4px 0;font-size:14px;">${esc(value)}</td></tr>`).join("")}
        <tr><td style="padding:12px 0 0;border-top:1px solid #eee8de;font-size:16px;font-weight:bold;">Total</td><td align="right" style="padding:12px 0 0;border-top:1px solid #eee8de;font-size:16px;font-weight:bold;">${esc(total)}</td></tr>
      </table>
    </td></tr>`;

  const html = layout(settings, {
    title: `Order ${order.orderNumber}`,
    preheader: `Your order ${order.orderNumber} is confirmed. Total ${total}.`,
    eyebrow: "Order confirmed",
    heading: `Thank you, ${name}`,
    paragraphs: [received, payment, { muted: note }],
    button: { label: "View your order", href: link },
    rows: itemsRow(order, money) + totalsRow + addressRow(order),
    footer: "Questions about your order? Just reply to this email.",
  });

  const text = plainText([
    `Thank you, ${name}`,
    "",
    received,
    payment,
    note,
    "",
    `View your order: ${link}`,
    "",
    ...order.items.flatMap((item) => [
      `${item.quantity} x ${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ""} - ${money(item.unitPrice * item.quantity)}`,
      ...customLines(item).map((line) => `   ${line}`),
    ]),
    "",
    ...totals.map(([label, value]) => `${label}: ${value}`),
    `Total: ${total}`,
    "",
    "Delivering to:",
    ...addressLines(order),
    "",
    store.name,
    [store.email, store.phone].filter(Boolean).join(" | "),
  ]);

  return { subject: `Your ${store.name} order ${order.orderNumber} is confirmed`, html, text };
}

export type ShippingStage = "shipped" | "delivered";

/** Sent when an order is marked as shipped, and again when it is marked as delivered. */
export function shippingEmail(
  order: OrderWithItems,
  settings: SiteSettings,
  baseUrl: string,
  stage: ShippingStage,
): EmailContent {
  const { store } = settings;
  const name = firstName(order.name);
  const link = orderUrl(baseUrl, order.id);
  // Only an http(s) link the admin entered is used as the tracking link.
  const tracking = /^https?:\/\//i.test(order.trackingUrl ?? "") ? safeHref(order.trackingUrl, "") : "";
  const shipped = stage === "shipped";

  const subject = shipped
    ? `Your ${store.name} order ${order.orderNumber} is on its way`
    : `Your ${store.name} order ${order.orderNumber} has been delivered`;
  const heading = shipped ? "Your order is on its way" : "Your order has arrived";
  const lead = shipped
    ? `Good news, ${name}: order ${order.orderNumber} has left our atelier and is on its way to you.`
    : `${name}, order ${order.orderNumber} has been delivered. We hope you love it.`;
  const trackingLine = shipped && order.trackingNumber ? `Tracking number: ${order.trackingNumber}` : "";
  const payment =
    shipped && order.paymentMethod === "cod" && order.paymentStatus !== "paid"
      ? `Please keep ${formatMoney(order.total, store)} ready to pay in cash on delivery.`
      : "";
  const closing = shipped ? "" : "If anything is not right, reply to this email and we will make it right.";
  const button =
    shipped && tracking
      ? { label: "Track your shipment", href: tracking }
      : { label: "View your order", href: link };

  const html = layout(settings, {
    title: `Order ${order.orderNumber}`,
    preheader: lead,
    eyebrow: shipped ? "Shipping update" : "Delivered",
    heading,
    paragraphs: [lead, trackingLine, payment, { muted: closing }],
    button,
    rows: itemsRow(order) + addressRow(order),
    footer: "Questions about your order? Just reply to this email.",
  });

  const text = plainText([
    heading,
    "",
    lead,
    trackingLine,
    payment,
    closing,
    "",
    shipped && tracking ? `Track your shipment: ${tracking}` : null,
    `View your order: ${link}`,
    "",
    ...order.items.map(
      (item) => `${item.quantity} x ${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ""}`,
    ),
    "",
    "Delivering to:",
    ...addressLines(order),
    "",
    store.name,
    [store.email, store.phone].filter(Boolean).join(" | "),
  ]);

  return { subject, html, text };
}

/** Sent when someone asks to reset their password. `link` is single-use and short-lived. */
export function passwordResetEmail(
  settings: SiteSettings,
  recipientName: string,
  link: string,
  validMinutes: number,
): EmailContent {
  const { store } = settings;
  const lead = `We received a request to reset the password for your ${store.name} account.`;
  const validity = `This link works once and expires in ${validMinutes} minutes.`;
  const ignore = "If you did not ask for this, you can ignore this email. Your password will not change.";

  const html = layout(settings, {
    title: "Reset your password",
    preheader: `Reset your ${store.name} password. ${validity}`,
    eyebrow: "Account",
    heading: `Hello, ${firstName(recipientName)}`,
    paragraphs: [lead, validity, { muted: ignore }],
    button: { label: "Choose a new password", href: link },
    footer: "Need help? Just reply to this email.",
  });

  const text = plainText([
    `Hello, ${firstName(recipientName)}`,
    "",
    lead,
    "",
    `Choose a new password: ${link}`,
    "",
    validity,
    ignore,
    "",
    store.name,
  ]);

  return { subject: `Reset your ${store.name} password`, html, text };
}

/** Totals for text messages avoid currency symbols, which force costlier Unicode SMS. */
function smsMoney(minor: number, currencyCode: string, locale: string) {
  let amount: string;
  try {
    amount = new Intl.NumberFormat(locale, {
      minimumFractionDigits: minor % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(minor / 100);
  } catch {
    amount = (minor / 100).toFixed(2);
  }
  return currencyCode === "INR" ? `Rs.${amount}` : `${currencyCode} ${amount}`;
}

/** The confirmation text message, built from the template in Settings. */
export function orderSms(order: Order, settings: SiteSettings, baseUrl: string) {
  const { store, checkout } = settings;
  const values: Record<string, string> = {
    store: store.name,
    name: firstName(order.name),
    order: order.orderNumber,
    total: smsMoney(order.total, store.currencyCode, store.locale),
    link: orderUrl(baseUrl, order.id),
  };
  return checkout.smsTemplate
    .replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match)
    .replace(/\s+/g, " ")
    .trim();
}
