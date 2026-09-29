declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function initDataLayer() {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
}

export function pageView(url: string) {
  if (typeof window === "undefined") return;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (window.gtag && gaId) {
    window.gtag("config", gaId, { page_path: url });
    window.gtag("event", "page_view", { page_path: url });
  }
  if (window.fbq) {
    window.fbq("track", "PageView");
  }
}

export type ContentItem = {
  id: string;
  quantity?: number;
  item_price?: number;
};

export function trackViewContent(
  contentIds: string[],
  value: number,
  currency = "GBP"
) {
  if (typeof window === "undefined") return;
  if (window.fbq) {
    window.fbq("track", "ViewContent", {
      content_ids: contentIds,
      content_type: "product",
      value,
      currency,
    });
  }
  if (window.gtag) {
    window.gtag("event", "view_item", {
      currency,
      value,
      items: contentIds.map((id) => ({
        item_id: id,
      })),
    });
  }
}

export function trackAddToCart(
  contents: ContentItem[],
  value: number,
  currency = "GBP"
) {
  if (typeof window === "undefined") return;
  const ids = contents.map((c) => c.id);
  if (window.fbq) {
    window.fbq("track", "AddToCart", {
      content_ids: ids,
      content_type: "product",
      value,
      currency,
    });
  }
  if (window.gtag) {
    window.gtag("event", "add_to_cart", {
      currency,
      value,
      items: contents.map((c) => ({
        item_id: c.id,
        quantity: c.quantity ?? 1,
        price: c.item_price,
      })),
    });
  }
}

export function trackInitiateCheckout(
  contents: ContentItem[],
  value: number,
  currency = "GBP"
) {
  if (typeof window === "undefined") return;
  const ids = contents.map((c) => c.id);
  if (window.fbq) {
    window.fbq("track", "InitiateCheckout", {
      content_ids: ids,
      content_type: "product",
      value,
      currency,
    });
  }
  if (window.gtag) {
    window.gtag("event", "begin_checkout", {
      currency,
      value,
      items: contents.map((c) => ({
        item_id: c.id,
        quantity: c.quantity ?? 1,
      })),
    });
  }
}

export function trackPurchase(params: {
  value: number;
  currency?: string;
  transaction_id: string;
  contents?: ContentItem[];
}) {
  const { value, currency = "GBP", transaction_id, contents = [] } = params;
  if (typeof window === "undefined") return;
  if (window.fbq) {
    window.fbq("track", "Purchase", {
      value,
      currency,
      content_ids: contents.map((c) => c.id),
      content_type: "product",
    });
  }
  if (window.gtag) {
    window.gtag("event", "purchase", {
      transaction_id,
      value,
      currency,
      items: contents.map((c) => ({
        item_id: c.id,
        quantity: c.quantity ?? 1,
      })),
    });
  }
}
