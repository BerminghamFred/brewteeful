/**
 * Branded transactional emails. Plain table layout + inline styles so they render in
 * Gmail, Outlook and Apple Mail. Every customer-supplied value goes through esc().
 */
import { BRAND } from "@/lib/brand";
import { addWorkingDays, estimateDelivery, formatDay } from "@/lib/delivery";
import { gbp } from "@/lib/format";
import type { SiteSettings } from "@/lib/settings";
import type { Order, OrderItem } from "@/lib/types";
import { SIZE_TBC } from "@/lib/sizes";

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
/** Pay-now-sizes-later orders: items stay SIZE_TBC until the group fills them in. */
const awaitingSizes = (order: Order, items: OrderItem[]) =>
  Boolean(order.sizes_token && !order.sizes_completed_at && items.some((i) => i.size === SIZE_TBC));
export const sizesUrl = (token: string) => `${BRAND.siteUrl}/sizes/${token}`;
const sizeLabel = (i: OrderItem) => (i.size === SIZE_TBC ? "Size to follow" : `Size ${i.size}`);
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

function shell(opts: { preheader: string; body: string; settings: SiteSettings; internal?: boolean }) {
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
    ${opts.internal ? `<tr><td style="padding:8px 32px 28px;font:12px/1.5 ${FONT};color:#9a958c;">Order alert · reply goes to the customer.</td></tr>` : footer(opts.settings)}
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
          <span style="color:${C.mute};">${esc(i.product_name)} · ${esc(sizeLabel(i))}</span>
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
const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 6px;"><tr><td style="border-radius:999px;background:${C.ink};"><a href="${esc(href)}" style="display:inline-block;padding:14px 26px;font:700 15px/1 ${FONT};color:#ffffff;text-decoration:none;">${label}</a></td></tr></table>`;
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
  const waiting = awaitingSizes(order, items);
  const link = order.sizes_token ? sizesUrl(order.sizes_token) : "";
  const missing = items.filter((i) => i.size === SIZE_TBC).length;
  const subject = waiting
    ? `Order #${order.order_number} confirmed — now add everyone's sizes`
    : `Order #${order.order_number} confirmed — your stag shirts are going to print`;

  const body = `
    <tr><td style="padding:32px 32px 8px;">
      ${h1(waiting ? "Paid. Now for the sizes." : "Shirts sorted. Legend.")}
      ${
        waiting
          ? `${p(`Cheers ${esc(firstName(order))} — order <strong>#${order.order_number}</strong> is confirmed and paid. One last step: <strong>${missing} ${missing === 1 ? "size is" : "sizes are"} still needed.</strong>`)}
             ${p(`Send this link to the group chat so everyone adds their own size. <strong>We start printing as soon as the last size is in</strong>, so the sooner they're filled in, the sooner your shirts arrive.`)}
             ${button(link, "Add everyone's sizes →")}
             <p style="margin:6px 0 0;font:13px/1.5 ${FONT};color:${C.mute};word-break:break-all;">${esc(link)}</p>`
          : p(`Cheers ${esc(firstName(order))} — order <strong>#${order.order_number}</strong> is confirmed and paid. Your set goes to print within one working day.`)
      }
      <div style="margin:18px 0 8px;padding:14px 16px;border-radius:14px;background:${C.paper};font:15px/1.5 ${FONT};color:${C.ink};">
        <strong>${
          waiting
            ? `Arrives ${d.production_days_min + d.standard_days_min}–${d.production_days_max + d.standard_days_max} working days after the last size is in`
            : `Arriving ${esc(range(est.earliest, est.latest))}`
        }</strong>${waiting ? `<br><span style="color:${C.mute};">All sizes in today? Arriving ${esc(range(est.earliest, est.latest))}.</span>` : ""}${stag ? `<br><span style="color:${C.mute};">Stag date: ${esc(formatDay(stag))}</span>` : ""}
      </div>
    </td></tr>
    ${section(`${h2("The lineup")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lineupRows(items, products)}</table>`)}
    ${section(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${totalsRows(order)}</table>`)}
    ${addr.length ? section(`${h2("Delivering to")}<p style="margin:0;font:14px/1.6 ${FONT};color:${C.ink};">${addr.map(esc).join("<br>")}</p>`) : ""}
    ${section(`${h2("What happens next")}
      <p style="margin:0;font:14px/1.7 ${FONT};color:${C.ink};">
        ${waiting ? `<strong>0. Sizes</strong> — everyone adds theirs at the link above. Printing starts when the last one's in.<br>` : ""}
        <strong>1. Printing</strong> — ${d.production_days_min}–${d.production_days_max} working days.<br>
        <strong>2. Dispatch</strong> — one tracked parcel. We'll email your tracking link the moment it ships.<br>
        <strong>3. Arrives</strong> — ${esc(range(est.earliest, est.latest))}.
      </p>
      <p style="margin:12px 0 0;font:14px/1.6 ${FONT};color:${C.mute};">Spotted a wrong size or name? Reply to this email today and we'll fix it before it prints.</p>`)}
  `;

  const text = [
    `Shirts sorted. Legend.`,
    ``,
    ...(waiting
      ? [
          `Cheers ${firstName(order)} — order #${order.order_number} is confirmed and paid. One last step: ${missing} ${missing === 1 ? "size is" : "sizes are"} still needed.`,
          `Send this link to the group chat so everyone adds their own size. We start printing as soon as the last size is in, so the sooner they're filled in, the sooner your shirts arrive:`,
          link,
          `Arrives ${d.production_days_min + d.standard_days_min}–${d.production_days_max + d.standard_days_max} working days after the last size is in${stag ? ` (stag date: ${formatDay(stag)})` : ""}.`,
        ]
      : [
          `Cheers ${firstName(order)} — order #${order.order_number} is confirmed and paid. Your set goes to print within one working day.`,
          `Arriving ${range(est.earliest, est.latest)}${stag ? ` (stag date: ${formatDay(stag)})` : ""}.`,
        ]),
    ``,
    `THE LINEUP`,
    ...items.map((i) => `- ${personLabel(i)}: ${i.product_name}, ${sizeLabel(i).toLowerCase()}`),
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

  const preheader = waiting ? "Send the sizes link to the group — printing starts when the last size is in." : `Arriving ${range(est.earliest, est.latest)}. Here's your lineup.`;
  return { subject, html: shell({ preheader, body, settings }), text };
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

/** Internal "you've got an order" alert for the shop owner — plain, scannable, links to admin. */
export function newOrderAlertEmail(args: { order: Order; items: OrderItem[]; settings: SiteSettings }) {
  const { order, items, settings } = args;
  const d = settings.delivery;
  const est = estimateDelivery(d, order.shipping_method === "express" ? "express" : "standard", new Date(order.paid_at ?? order.created_at));
  const stag = order.event_date ? new Date(`${order.event_date}T12:00`) : null;
  const addr = addressLines(order);
  const adminUrl = `${BRAND.siteUrl}/admin/orders/${order.id}`;
  const subject = `New order #${order.order_number} — ${gbp(order.total_pence)} (${order.item_count} shirts)`;
  const row = (k: string, v: string) =>
    `<tr><td style="padding:3px 12px 3px 0;font:14px/1.5 ${FONT};color:${C.mute};white-space:nowrap;vertical-align:top;">${k}</td><td style="padding:3px 0;font:14px/1.5 ${FONT};color:${C.ink};">${v}</td></tr>`;

  const body = `
    <tr><td style="padding:32px 32px 8px;">
      ${h1(`New order #${order.order_number}`)}
      ${p(`<strong>${gbp(order.total_pence)}</strong> · ${order.item_count} shirts${order.discount_code ? ` · code ${esc(order.discount_code)}` : ""}`)}
      ${
        awaitingSizes(order, items)
          ? `<p style="margin:12px 0 0;padding:10px 14px;border-radius:12px;background:#fff1ec;font:600 14px/1.5 ${FONT};color:${C.ink};">Pay now, sizes later — ${items.filter((i) => i.size === SIZE_TBC).length} sizes still to come. Don't print yet: you'll get another email when they're all in.</p>`
          : ""
      }
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:14px;">
        ${row("Customer", esc(order.customer_name ?? "—"))}
        ${row("Email", order.email ? `<a href="mailto:${esc(order.email)}" style="color:${C.pitch};">${esc(order.email)}</a>` : "—")}
        ${order.phone ? row("Phone", esc(order.phone)) : ""}
        ${row("Stag date", stag ? esc(formatDay(stag)) : "not given")}
        ${row("Promised", esc(range(est.earliest, est.latest)))}
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 8px;"><tr><td style="border-radius:999px;background:${C.ink};">
        <a href="${esc(adminUrl)}" style="display:inline-block;padding:12px 22px;font:700 14px/1 ${FONT};color:#ffffff;text-decoration:none;">Open in admin →</a>
      </td></tr></table>
    </td></tr>
    ${section(`${h2("To print")}<p style="margin:0;font:14px/1.7 ${FONT};color:${C.ink};">${items
      .map((i) => `<strong>${esc(i.product_name)}</strong> · ${esc(i.size === SIZE_TBC ? "size TBC" : i.size)} <span style="color:${C.mute};">— ${esc(personLabel(i))}</span>`)
      .join("<br>")}</p>`)}
    ${addr.length ? section(`${h2("Ship to")}<p style="margin:0;font:14px/1.6 ${FONT};color:${C.ink};">${addr.map(esc).join("<br>")}</p>`) : ""}
  `;

  const text = [
    `New order #${order.order_number} — ${gbp(order.total_pence)} (${order.item_count} shirts)${order.discount_code ? `, code ${order.discount_code}` : ""}`,
    `Customer: ${order.customer_name ?? "—"} <${order.email ?? "—"}>${order.phone ? ` ${order.phone}` : ""}`,
    `Stag date: ${stag ? formatDay(stag) : "not given"} · Promised: ${range(est.earliest, est.latest)}`,
    ``,
    `TO PRINT`,
    ...items.map((i) => `- ${i.product_name}, ${i.size} (${personLabel(i)})`),
    ...(addr.length ? [``, `SHIP TO`, ...addr] : []),
    ``,
    adminUrl,
  ].join("\n");

  return { subject, html: shell({ preheader: `${order.item_count} shirts · ${gbp(order.total_pence)}`, body, settings, internal: true }), text };
}

/** Customer: every size is in, the set is going to print. */
export function sizesCompleteEmail(args: { order: Order; items: OrderItem[]; products: Record<string, EmailProduct>; settings: SiteSettings }) {
  const { order, items, products, settings } = args;
  const est = estimateDelivery(settings.delivery, order.shipping_method === "express" ? "express" : "standard", new Date());
  const subject = `All sizes in — order #${order.order_number} is going to print`;
  const body = `
    <tr><td style="padding:32px 32px 8px;">
      ${h1("All sizes in. Printing now.")}
      ${p(`Nice one ${esc(firstName(order))} — everyone's size is in for order <strong>#${order.order_number}</strong>, so your set goes to print within one working day.`)}
      <div style="margin:18px 0 8px;padding:14px 16px;border-radius:14px;background:${C.paper};font:15px/1.5 ${FONT};color:${C.ink};"><strong>Arriving ${esc(range(est.earliest, est.latest))}</strong></div>
    </td></tr>
    ${section(`${h2("The lineup")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lineupRows(items, products)}</table>`)}
  `;
  const text = [
    `All sizes in. Printing now.`,
    ``,
    `Everyone's size is in for order #${order.order_number}, so your set goes to print within one working day. Arriving ${range(est.earliest, est.latest)}.`,
    ``,
    ...items.map((i) => `- ${personLabel(i)}: ${i.product_name}, size ${i.size}`),
  ].join("\n");
  return { subject, html: shell({ preheader: `Arriving ${range(est.earliest, est.latest)}.`, body, settings }), text };
}

/** Owner: a pay-now-sizes-later order is complete and can be printed. */
export function sizesCompleteAlertEmail(args: { order: Order; items: OrderItem[]; settings: SiteSettings }) {
  const alert = newOrderAlertEmail(args);
  return { ...alert, subject: `Sizes complete — order #${args.order.order_number} ready to print` };
}

/** "Email me this lineup" (A/B/C option 2). */
export function savedLineupEmail(args: { link: string; groupSize: number | null; settings: SiteSettings }) {
  const { link, groupSize, settings } = args;
  const subject = "Your stag lineup — pick up where you left off";
  const body = `
    <tr><td style="padding:32px 32px 8px;">
      ${h1("Your lineup, saved.")}
      ${p(`Here's the ${groupSize ? `${groupSize}-person ` : ""}lineup you started. Open it any time to change designs, add sizes and check out.`)}
      ${p(`Don't know everyone's size? Forward this link to the group chat — everyone can open it and pick theirs.`)}
      ${button(link, "Open my lineup →")}
      <p style="margin:6px 0 0;font:13px/1.5 ${FONT};color:${C.mute};word-break:break-all;">${esc(link)}</p>
    </td></tr>
  `;
  const text = [
    `Your lineup, saved.`,
    ``,
    `Here's the lineup you started. Open it any time to change designs, add sizes and check out:`,
    link,
    ``,
    `Don't know everyone's size? Forward this link to the group chat — everyone can open it and pick theirs.`,
  ].join("\n");
  return { subject, html: shell({ preheader: "Open it any time to add sizes and check out.", body, settings }), text };
}

export const resumeUrl = (orderId: string) => `${BRAND.siteUrl}/resume/${orderId}`;
export const unsubscribeUrl = (orderId: string) => `${BRAND.siteUrl}/api/unsubscribe?o=${orderId}`;

/** Customer: they reached payment but didn't finish. Sent once, only if they agreed at checkout. */
export function abandonedReminderEmail(args: { order: Order; items: OrderItem[]; products: Record<string, EmailProduct>; settings: SiteSettings }) {
  const { order, items, products, settings } = args;
  const est = estimateDelivery(settings.delivery, order.shipping_method === "express" ? "express" : "standard");
  const designs = [...new Set(items.map((i) => i.product_name))];
  const subject = designs.length === 1 && items.length === 1 ? `Your ${designs[0]} shirt is still waiting` : "Your stag set is still waiting";
  const link = resumeUrl(order.id);
  const unsub = unsubscribeUrl(order.id);
  const shirtsText = `${order.item_count} ${order.item_count === 1 ? "shirt" : "shirts"}`;
  const delivery = order.shipping_pence ? `${gbp(order.shipping_pence)} delivery` : "free UK delivery";
  const body = `
    <tr><td style="padding:32px 32px 8px;">
      ${h1("Your order's still here.")}
      ${p(`You got as far as payment but didn't finish — no problem, we've kept it for you.`)}
      ${button(link, "Finish my order →")}
    </td></tr>
    ${section(`${h2("What you picked")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lineupRows(items, products)}</table>
      <p style="margin:10px 0 0;font:700 16px/1.5 ${FONT};color:${C.ink};">${gbp(order.total_pence)} <span style="font-weight:400;color:${C.mute};">· ${shirtsText} · ${delivery}</span></p>`)}
    ${section(`<p style="margin:0;font:14px/1.7 ${FONT};color:${C.ink};">
      ✓ Order today and it should arrive <strong>${esc(range(est.earliest, est.latest))}</strong><br>
      ✓ ${esc(settings.content.guarantee)}<br>
      ✓ Questions about sizing or delivery? Just reply to this email.
    </p>`)}
    <tr><td style="padding:0 32px 8px;font:12px/1.6 ${FONT};color:#9a958c;">
      This is a one-off reminder because you started an order at ${esc(BRAND.siteUrl.replace(/^https?:\/\//, ""))}. We won't send another.
      <a href="${esc(unsub)}" style="color:#9a958c;">Unsubscribe</a>.
    </td></tr>
  `;
  const text = [
    `Your order's still here.`,
    ``,
    `You got as far as payment but didn't finish — no problem, we've kept it for you.`,
    ``,
    ...items.map((i) => `- ${i.product_name}, ${sizeLabel(i)}`),
    `${gbp(order.total_pence)} · ${shirtsText} · ${delivery}`,
    ``,
    `Finish your order: ${link}`,
    ``,
    `Order today and it should arrive ${range(est.earliest, est.latest)}.`,
    settings.content.guarantee,
    `Questions? Just reply to this email.`,
    ``,
    `One-off reminder because you started an order with us. Unsubscribe: ${unsub}`,
  ].join("\n");
  return {
    subject,
    html: shell({ preheader: `${shirtsText}, ${delivery}. Finish in under a minute.`, body, settings }),
    text,
    headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  };
}

/** Owner: someone reached payment an hour ago and didn't pay. */
export function abandonedAlertEmail(args: { order: Order; items: OrderItem[]; settings: SiteSettings; reminder: "sent" | "opted_out" | "suppressed" | "skipped" }) {
  const { order, items, settings, reminder } = args;
  const adminUrl = `${BRAND.siteUrl}/admin/orders/${order.id}`;
  const landing = (order.experiments as Record<string, string> | null)?.["ad-landing"];
  const reminderText = {
    sent: "Reminder email sent to them.",
    opted_out: "They unticked the reminder, so we haven't emailed them.",
    suppressed: "They've unsubscribed before, so we haven't emailed them.",
    skipped: "No reminder sent (they were reminded recently or have since ordered).",
  }[reminder];
  const subject = `Abandoned checkout #${order.order_number} — ${gbp(order.total_pence)}, ${order.item_count} ${order.item_count === 1 ? "shirt" : "shirts"}`;
  const row = (k: string, v: string) =>
    `<tr><td style="padding:3px 12px 3px 0;font:14px/1.5 ${FONT};color:${C.mute};white-space:nowrap;vertical-align:top;">${k}</td><td style="padding:3px 0;font:14px/1.5 ${FONT};color:${C.ink};">${v}</td></tr>`;
  const started = new Date(order.created_at).toLocaleString("en-GB", { timeZone: "Europe/London", weekday: "short", hour: "2-digit", minute: "2-digit" });
  const body = `
    <tr><td style="padding:32px 32px 8px;">
      ${h1(`Abandoned checkout #${order.order_number}`)}
      ${p(`Reached payment at <strong>${esc(started)}</strong> and hasn't paid. ${esc(reminderText)}`)}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:14px;">
        ${row("Email", order.email ? `<a href="mailto:${esc(order.email)}" style="color:${C.pitch};">${esc(order.email)}</a>` : "—")}
        ${row("Basket", esc(`${gbp(order.total_pence)} · ${items.map((i) => `${i.product_name} ${i.size}`).join(", ")}`))}
        ${landing ? row("Ad landing", esc(landing)) : ""}
      </table>
      ${p(`Want to follow up personally? Reply to this email — it goes to them.`)}
      ${button(adminUrl, "Open in admin →")}
    </td></tr>`;
  const text = [
    subject,
    `Reached payment at ${started} and hasn't paid. ${reminderText}`,
    `Email: ${order.email ?? "—"}`,
    `Basket: ${gbp(order.total_pence)} · ${items.map((i) => `${i.product_name} ${i.size}`).join(", ")}`,
    landing ? `Ad landing: ${landing}` : "",
    ``,
    adminUrl,
  ].join("\n");
  return { subject, html: shell({ preheader: `${order.email ?? ""} · ${gbp(order.total_pence)}`, body, settings, internal: true }), text };
}
