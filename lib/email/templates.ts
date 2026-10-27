/**
 * Branded transactional emails. Plain table layout + inline styles so they render in
 * Gmail, Outlook and Apple Mail. Every customer-supplied value goes through esc().
 */
import { BRAND } from "@/lib/brand";
import { addWorkingDays, estimateDelivery, formatDay } from "@/lib/delivery";
import { gbp } from "@/lib/format";
import type { SiteSettings } from "@/lib/settings";
import type { Order, OrderItem } from "@/lib/types";

const C = { pitch: "#0f3b2c", ink: "#0e0e10", paper: "#f6f5f1", mute: "#6f6b64", line: "#e8e6e0", flare: "#ff5a2c" };
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

export type EmailProduct = { name: string; imageUrl: string | null; color: string };

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Images must be absolute https URLs to load in mail clients. */
function abs(url: string | null | undefined) {
  if (!url) return null;
  try {
    const u = new URL(url, BRAND.siteUrl);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

const firstName = (order: Order) => (order.customer_name ?? "").trim().split(/\s+/)[0] || "legend";
const personLabel = (i: OrderItem) =>
  i.is_stag ? `★ The Stag${i.nickname ? ` (${i.nickname})` : ""}` : i.nickname || `Person ${i.position}`;
const range = (a: Date, b: Date) => (a.getTime() === b.getTime() ? formatDay(a) : `${formatDay(a)} – ${formatDay(b)}`);

function addressLines(order: Order) {
  const a = order.shipping_address;
  if (!a) return [];
  return [a.name, a.line1, a.line2, a.city, a.state, a.postal_code].filter(Boolean) as string[];
}

function footer(settings: SiteSettings) {
  const c = settings.contact;
  const legal = [c.company_name || BRAND.legalName, c.business_address].filter(Boolean).map(esc).join(" · ");
  return `
  <tr><td style="padding:24px 32px 32px;font:13px/1.6 ${FONT};color:${C.mute};">
    Questions? Just reply to this email${c.email ? ` or write to <a href="mailto:${esc(c.email)}" style="color:${C.pitch};">${esc(c.email)}</a>` : ""}. ${esc(c.response_time)}<br>
    ${esc(settings.content.guarantee)}<br><br>
    <span style="color:#9a958c;">${legal}${c.company_registration ? `<br>${esc(c.company_registration)}` : ""}</span>
  </td></tr>`;
}

function shell(opts: { preheader: string; body: string; settings: SiteSettings }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(BRAND.name)}</title></head>
<body style="margin:0;padding:0;background:${C.paper};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper};"><tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;">
    <tr><td style="background:${C.pitch};padding:22px 32px;">
      <a href="${esc(BRAND.siteUrl)}" style="font:800 22px/1 ${FONT};letter-spacing:-0.5px;color:#ffffff;text-decoration:none;">${esc(BRAND.name)}</a>
    </td></tr>
    ${opts.body}
    ${footer(opts.settings)}
  </table>
</td></tr></table>
</body></html>`;
}

function lineupRows(items: OrderItem[], products: Record<string, EmailProduct>) {
  return items
    .map((i) => {
      const p = i.product_id ? products[i.product_id] : undefined;
      const img = abs(p?.imageUrl);
      const thumb = img
        ? `<img src="${esc(img)}" width="64" height="64" alt="" style="display:block;width:64px;height:64px;border-radius:12px;object-fit:cover;background:${esc(p?.color ?? C.line)};">`
        : `<div style="width:64px;height:64px;border-radius:12px;background:${esc(p?.color ?? C.line)};"></div>`;
      return `<tr>
        <td width="76" style="padding:8px 0;">${thumb}</td>
        <td style="padding:8px 0;font:14px/1.45 ${FONT};color:${C.ink};">
          <strong>${esc(personLabel(i))}</strong><br>
          <span style="color:${C.mute};">${esc(i.product_name)} · Size ${esc(i.size)}</span>
        </td>
      </tr>`;
    })
    .join("");
}

function totalsRows(order: Order) {
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:3px 0;font:${strong ? "700 16px" : "14px"}/1.5 ${FONT};color:${strong ? C.ink : C.mute};">${label}</td><td align="right" style="padding:3px 0;font:${strong ? "700 16px" : "14px"}/1.5 ${FONT};color:${C.ink};">${value}</td></tr>`;
  return [
    row(`${order.item_count} shirts`, gbp(order.subtotal_pence)),
    order.discount_pence ? row(`Discount${order.discount_code ? ` (${esc(order.discount_code)})` : ""}`, `−${gbp(order.discount_pence)}`) : "",
    row("Delivery", order.shipping_pence ? gbp(order.shipping_pence) : "Free"),
    row("Total paid", gbp(order.total_pence), true),
  ].join("");
}

const h1 = (t: string) => `<h1 style="margin:0;font:800 30px/1.1 ${FONT};letter-spacing:-0.8px;color:${C.ink};">${t}</h1>`;
const p = (t: string) => `<p style="margin:12px 0 0;font:15px/1.6 ${FONT};color:${C.ink};">${t}</p>`;
const h2 = (t: string) => `<p style="margin:0 0 8px;font:700 12px/1 ${FONT};letter-spacing:1.4px;text-transform:uppercase;color:${C.mute};">${t}</p>`;
const section = (inner: string) => `<tr><td style="padding:0 32px;"><div style="border-top:1px solid ${C.line};padding:20px 0;">${inner}</div></td></tr>`;

export function orderConfirmationEmail(args: {
  order: Order;
  items: OrderItem[];
  products: Record<string, EmailProduct>;
  settings: SiteSettings;
}) {
  const { order, items, products, settings } = args;
  const d = settings.delivery;
  const est = estimateDelivery(d, order.shipping_method === "express" ? "express" : "standard", new Date(order.paid_at ?? order.created_at));
  const stag = order.event_date ? new Date(`${order.event_date}T12:00`) : null;
  const addr = addressLines(order);
  const subject = `Order #${order.order_number} confirmed — your stag shirts are going to print`;

  const body = `
    <tr><td style="padding:32px 32px 8px;">
      ${h1("Shirts sorted. Legend.")}
      ${p(`Cheers ${esc(firstName(order))} — order <strong>#${order.order_number}</strong> is confirmed and paid. Your set goes to print within one working day.`)}
      <div style="margin:18px 0 8px;padding:14px 16px;border-radius:14px;background:${C.paper};font:15px/1.5 ${FONT};color:${C.ink};">
        <strong>Arriving ${esc(range(est.earliest, est.latest))}</strong>${stag ? `<br><span style="color:${C.mute};">Stag date: ${esc(formatDay(stag))}</span>` : ""}
      </div>
    </td></tr>
    ${section(`${h2("The lineup")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lineupRows(items, products)}</table>`)}
    ${section(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${totalsRows(order)}</table>`)}
    ${addr.length ? section(`${h2("Delivering to")}<p style="margin:0;font:14px/1.6 ${FONT};color:${C.ink};">${addr.map(esc).join("<br>")}</p>`) : ""}
    ${section(`${h2("What happens next")}
      <p style="margin:0;font:14px/1.7 ${FONT};color:${C.ink};">
        <strong>1. Printing</strong> — ${d.production_days_min}–${d.production_days_max} working days.<br>
        <strong>2. Dispatch</strong> — one tracked parcel. We'll email your tracking link the moment it ships.<br>
        <strong>3. Arrives</strong> — ${esc(range(est.earliest, est.latest))}.
      </p>
      <p style="margin:12px 0 0;font:14px/1.6 ${FONT};color:${C.mute};">Spotted a wrong size or name? Reply to this email today and we'll fix it before it prints.</p>`)}
  `;

  const text = [
    `Shirts sorted. Legend.`,
    ``,
    `Cheers ${firstName(order)} — order #${order.order_number} is confirmed and paid. Your set goes to print within one working day.`,
    `Arriving ${range(est.earliest, est.latest)}${stag ? ` (stag date: ${formatDay(stag)})` : ""}.`,
    ``,
    `THE LINEUP`,
    ...items.map((i) => `- ${personLabel(i)}: ${i.product_name}, size ${i.size}`),
    ``,
    `${order.item_count} shirts: ${gbp(order.subtotal_pence)}`,
    ...(order.discount_pence ? [`Discount: -${gbp(order.discount_pence)}`] : []),
    `Delivery: ${order.shipping_pence ? gbp(order.shipping_pence) : "Free"}`,
    `Total paid: ${gbp(order.total_pence)}`,
    ...(addr.length ? [``, `DELIVERING TO`, ...addr] : []),
    ``,
    `Spotted a wrong size or name? Reply to this email today and we'll fix it before it prints.`,
    ``,
    `${settings.content.guarantee}`,
    settings.contact.email ? `Questions? ${settings.contact.email}` : ``,
  ].join("\n");

  return { subject, html: shell({ preheader: `Arriving ${range(est.earliest, est.latest)}. Here's your lineup.`, body, settings }), text };
}

export function orderShippedEmail(args: {
  order: Order;
  items: OrderItem[];
  products: Record<string, EmailProduct>;
  settings: SiteSettings;
}) {
  const { order, items, products, settings } = args;
  const d = settings.delivery;
  const shipped = new Date(order.shipped_at ?? Date.now());
  const eta =
    order.shipping_method === "express"
      ? { earliest: addWorkingDays(shipped, d.express_days), latest: addWorkingDays(shipped, d.express_days) }
      : { earliest: addWorkingDays(shipped, d.standard_days_min), latest: addWorkingDays(shipped, d.standard_days_max) };
  const subject = `Order #${order.order_number} is on its way`;
  const trackingUrl = order.tracking_url && /^https?:\/\//i.test(order.tracking_url) ? order.tracking_url : null;
  const carrierLine = [order.carrier, order.tracking_number].filter(Boolean).map(esc).join(" · ");

  const body = `
    <tr><td style="padding:32px 32px 8px;">
      ${h1("Your shirts are on the way.")}
      ${p(`Good news ${esc(firstName(order))} — order <strong>#${order.order_number}</strong> has shipped in one tracked parcel. Expected <strong>${esc(range(eta.earliest, eta.latest))}</strong>.`)}
      ${carrierLine ? `<p style="margin:14px 0 0;font:14px/1.5 ${FONT};color:${C.mute};">${carrierLine}</p>` : ""}
      ${
        trackingUrl
          ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 8px;"><tr><td style="border-radius:999px;background:${C.ink};">
              <a href="${esc(trackingUrl)}" style="display:inline-block;padding:14px 26px;font:700 15px/1 ${FONT};color:#ffffff;text-decoration:none;">Track your parcel →</a>
            </td></tr></table>`
          : ""
      }
    </td></tr>
    ${section(`${h2("In the parcel")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lineupRows(items, products)}</table>`)}
  `;

  const text = [
    `Your shirts are on the way.`,
    ``,
    `Order #${order.order_number} has shipped in one tracked parcel. Expected ${range(eta.earliest, eta.latest)}.`,
    ...(carrierLine ? [[order.carrier, order.tracking_number].filter(Boolean).join(" · ")] : []),
    ...(trackingUrl ? [`Track it: ${trackingUrl}`] : []),
    ``,
    `IN THE PARCEL`,
    ...items.map((i) => `- ${personLabel(i)}: ${i.product_name}, size ${i.size}`),
    ``,
    settings.content.guarantee,
    settings.contact.email ? `Questions? ${settings.contact.email}` : ``,
  ].join("\n");

  return { subject, html: shell({ preheader: `Expected ${range(eta.earliest, eta.latest)}.`, body, settings }), text };
}
