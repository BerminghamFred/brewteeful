import "server-only";
import { createHash } from "node:crypto";

const sha = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

/**
 * Meta Conversions API Purchase. Deduplicated with the browser pixel via event_id = order id.
 * Only call when the customer gave marketing consent.
 */
export async function sendMetaPurchase(p: {
  orderId: string;
  valuePence: number;
  itemCount: number;
  contentIds: string[];
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  postcode?: string | null;
  city?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  fbclid?: string | null;
  clientUa?: string | null;
  eventSourceUrl: string;
  eventTime: number;
}) {
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixel || !token) return;
  const user_data: Record<string, unknown> = { country: [sha("gb")] };
  if (p.email) user_data.em = [sha(p.email)];
  if (p.phone) user_data.ph = [sha(p.phone.replace(/[^\d]/g, "").replace(/^0/, "44"))];
  if (p.firstName) user_data.fn = [sha(p.firstName)];
  if (p.lastName) user_data.ln = [sha(p.lastName)];
  if (p.postcode) user_data.zp = [sha(p.postcode.replace(/\s/g, ""))];
  if (p.city) user_data.ct = [sha(p.city.replace(/\s/g, ""))];
  if (p.fbp) user_data.fbp = p.fbp;
  if (p.fbc) user_data.fbc = p.fbc;
  else if (p.fbclid) user_data.fbc = `fb.1.${p.eventTime * 1000}.${p.fbclid}`;
  if (p.clientUa) user_data.client_user_agent = p.clientUa;

  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: p.eventTime,
        event_id: p.orderId,
        action_source: "website",
        event_source_url: p.eventSourceUrl,
        user_data,
        custom_data: {
          currency: "GBP",
          value: p.valuePence / 100,
          content_ids: p.contentIds,
          content_type: "product",
          num_items: p.itemCount,
        },
      },
    ],
    ...(process.env.META_CAPI_TEST_EVENT_CODE ? { test_event_code: process.env.META_CAPI_TEST_EVENT_CODE } : {}),
  };
  const res = await fetch(`https://graph.facebook.com/v21.0/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error("meta capi", res.status, await res.text().catch(() => ""));
}
