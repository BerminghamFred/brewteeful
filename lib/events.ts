/** Shared (client + server) event taxonomy. See docs/PLAN.md §6. */

export const EVENT_NAMES = [
  "page_view",
  "click_cta",
  "view_collection",
  "view_item",
  "start_group_builder",
  "select_group_size",
  "select_design",
  "select_size",
  "set_event_date",
  "share_builder",
  "complete_group_builder",
  "add_to_cart",
  "view_cart",
  "apply_discount",
  "begin_checkout",
  "consent_update",
  "open_size_guide",
  "open_faq",
] as const;

/** `purchase` and `session_start` are server-generated only. */
export type ClientEventName = (typeof EVENT_NAMES)[number];
export type EventName = ClientEventName | "purchase";

export function isClientEvent(name: string): name is ClientEventName {
  return (EVENT_NAMES as readonly string[]).includes(name);
}

export const FUNNEL_STEPS = [
  { key: "sessions", label: "Sessions" },
  { key: "started_builder", label: "Started group builder" },
  { key: "completed_builder", label: "Configured group" },
  { key: "added_to_cart", label: "Added to basket" },
  { key: "began_checkout", label: "Started checkout" },
  { key: "purchased", label: "Purchased" },
] as const;

export type SessionAttribution = {
  landing_page?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  fbclid?: string;
};

export const ATTRIBUTION_KEYS: (keyof SessionAttribution)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
];

const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|adsbot|mediapartners/i;

export function isBot(ua: string | null | undefined) {
  return !ua || BOT_RE.test(ua);
}

export function deviceFromUa(ua: string | null | undefined): "mobile" | "tablet" | "desktop" {
  if (!ua) return "desktop";
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}
