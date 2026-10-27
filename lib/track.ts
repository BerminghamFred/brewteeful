/**
 * Browser-side tracking. One call fans out to:
 *   - first-party /api/events (source of truth for the admin funnel)
 *   - GA4 via gtag (Consent Mode v2 governs storage)
 *   - Meta Pixel (only loaded after marketing consent)
 */
import { ATTRIBUTION_KEYS, type ClientEventName, type SessionAttribution } from "@/lib/events";
import { COOKIES } from "@/lib/cookies";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
  }
}

export type GaItem = {
  item_id: string;
  item_name: string;
  item_variant?: string;
  price: number;
  quantity: number;
};

type TrackOptions = {
  /** Monetary value in pounds (GA/Meta convention). Stored as pence first-party. */
  value?: number;
  items?: GaItem[];
};

const GA_NAME: Partial<Record<ClientEventName, string>> = {
  view_collection: "view_item_list",
};

const META_NAME: Partial<Record<ClientEventName, string>> = {
  view_item: "ViewContent",
  complete_group_builder: "CustomizeProduct",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
};

type Queued = { name: string; path: string; props: Record<string, unknown>; value_pence?: number };
let queue: Queued[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

export function readCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function sessionAttribution(): SessionAttribution | undefined {
  const sid = readCookie(COOKIES.session);
  if (!sid) return undefined;
  try {
    if (sessionStorage.getItem("stg_registered") === sid) return undefined;
    sessionStorage.setItem("stg_registered", sid);
  } catch {
    /* storage blocked: register every flush, server ignores duplicates */
  }
  const url = new URL(window.location.href);
  const attr: SessionAttribution = {
    landing_page: url.pathname + url.search,
  };
  if (document.referrer && !document.referrer.startsWith(window.location.origin))
    attr.referrer = document.referrer;
  for (const k of ATTRIBUTION_KEYS) {
    const v = url.searchParams.get(k);
    if (v) attr[k] = v;
  }
  return attr;
}

function flush(useBeacon = false) {
  if (timer) clearTimeout(timer);
  timer = null;
  const session = sessionAttribution();
  if (!queue.length && !session) return;
  const payload = JSON.stringify({ events: queue, session });
  queue = [];
  if (useBeacon && navigator.sendBeacon) {
    navigator.sendBeacon("/api/events", new Blob([payload], { type: "application/json" }));
    return;
  }
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

if (typeof window !== "undefined") {
  const onHide = () => document.visibilityState === "hidden" && flush(true);
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", () => flush(true));
}

export function track(name: ClientEventName, props: Record<string, unknown> = {}, opts: TrackOptions = {}) {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  queue.push({
    name,
    path,
    props: opts.items ? { ...props, items: opts.items } : props,
    value_pence: opts.value != null ? Math.round(opts.value * 100) : undefined,
  });
  // Funnel-critical steps go out immediately; the rest are batched.
  if (["add_to_cart", "begin_checkout", "complete_group_builder", "start_group_builder"].includes(name)) flush();
  else if (!timer) timer = setTimeout(() => flush(), 1500);

  if (name === "page_view") {
    window.gtag?.("event", "page_view", { page_path: path, page_location: window.location.href });
    window.fbq?.("track", "PageView");
    return;
  }
  const gaParams: Record<string, unknown> = { ...props };
  if (opts.value != null) Object.assign(gaParams, { value: opts.value, currency: "GBP" });
  if (opts.items) gaParams.items = opts.items;
  window.gtag?.("event", GA_NAME[name] ?? name, gaParams);

  const meta = META_NAME[name];
  if (meta && window.fbq) {
    window.fbq("track", meta, {
      ...(opts.value != null ? { value: opts.value, currency: "GBP" } : {}),
      ...(opts.items
        ? { content_ids: opts.items.map((i) => i.item_id), content_type: "product", num_items: opts.items.reduce((a, i) => a + i.quantity, 0) }
        : {}),
    });
  }
}

/** Browser-side purchase tags. The first-party purchase is recorded server-side by the webhook. */
export function trackPurchaseTags(p: {
  orderId: string;
  orderNumber: number;
  value: number;
  shipping: number;
  discount: number;
  items: GaItem[];
  email?: string | null;
}) {
  const key = `stg_purchase_${p.orderId}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
    /* fire anyway; GA dedupes by transaction_id */
  }
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const adsLabel = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL;
  if (window.gtag) {
    if (p.email) window.gtag("set", "user_data", { email: p.email.trim().toLowerCase() });
    window.gtag("event", "purchase", {
      transaction_id: String(p.orderNumber),
      value: p.value,
      currency: "GBP",
      shipping: p.shipping,
      discount: p.discount,
      items: p.items,
    });
    if (adsId && adsLabel)
      window.gtag("event", "conversion", {
        send_to: `${adsId}/${adsLabel}`,
        value: p.value,
        currency: "GBP",
        transaction_id: String(p.orderNumber),
      });
  }
  window.fbq?.(
    "track",
    "Purchase",
    {
      value: p.value,
      currency: "GBP",
      content_ids: p.items.map((i) => i.item_id),
      content_type: "product",
      num_items: p.items.reduce((a, i) => a + i.quantity, 0),
    },
    { eventID: p.orderId }
  );
}
