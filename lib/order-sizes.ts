/**
 * Pay-now-sizes-later: the group fills in sizes for a paid order at /sizes/<token>.
 * Service-role only; the unguessable token is the only key.
 */
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { SIZE_TBC } from "@/lib/sizes";
import type { Order, OrderItem } from "@/lib/types";

export const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

export type SizesOrder = {
  order: Pick<Order, "id" | "order_number" | "status" | "fulfilment_status" | "sizes_completed_at" | "event_date" | "customer_name">;
  items: Pick<OrderItem, "id" | "position" | "is_stag" | "nickname" | "product_id" | "product_name" | "size">[];
};

export async function loadSizesOrder(token: string): Promise<SizesOrder | null> {
  if (!TOKEN_RE.test(token)) return null;
  const db = createAdminClient();
  const { data: order } = await db
    .from("orders")
    .select("id, order_number, status, fulfilment_status, sizes_completed_at, event_date, customer_name")
    .eq("sizes_token", token)
    .maybeSingle<SizesOrder["order"]>();
  if (!order) return null;
  const { data: items } = await db
    .from("order_items")
    .select("id, position, is_stag, nickname, product_id, product_name, size")
    .eq("order_id", order.id)
    .order("position")
    .returns<SizesOrder["items"]>();
  return { order, items: items ?? [] };
}

/** Sizes can be changed until they're all in (then printing starts) and only on paid orders. */
export function sizesEditable(o: SizesOrder["order"]) {
  return o.status === "paid" && o.fulfilment_status === "unfulfilled" && !o.sizes_completed_at;
}

export type SetSizeResult =
  | { ok: true; remaining: number; completedNow: boolean }
  | { ok: false; error: string; status: number };

export async function setItemSize(token: string, position: number, size: string, allowedSizes: string[]): Promise<SetSizeResult> {
  if (!allowedSizes.includes(size)) return { ok: false, error: "Unknown size", status: 400 };
  const data = await loadSizesOrder(token);
  if (!data) return { ok: false, error: "Order not found", status: 404 };
  if (!sizesEditable(data.order))
    return { ok: false, error: "Sizes for this order are locked — it's gone to print. Email us if something needs changing.", status: 409 };
  const item = data.items.find((i) => i.position === position);
  if (!item) return { ok: false, error: "Person not found", status: 404 };

  const db = createAdminClient();
  const { data: variant } = item.product_id
    ? await db.from("product_variants").select("id, sku, cost_pence, active").eq("product_id", item.product_id).eq("size", size).maybeSingle()
    : { data: null };
  if (item.product_id && (!variant || !variant.active)) return { ok: false, error: `${item.product_name} isn't available in ${size}`, status: 400 };

  const patch: Record<string, unknown> = { size, variant_id: variant?.id ?? null, sku: variant?.sku ?? null };
  if (variant?.cost_pence != null) patch.unit_cost_pence = variant.cost_pence;
  const { error } = await db.from("order_items").update(patch).eq("id", item.id);
  if (error) return { ok: false, error: "Couldn't save — try again", status: 500 };

  const remaining = data.items.filter((i) => (i.id === item.id ? false : i.size === SIZE_TBC)).length;
  let completedNow = false;
  if (remaining === 0) {
    // Claim completion once, even if two people save the last sizes at the same moment.
    const { data: claimed } = await db
      .from("orders")
      .update({ sizes_completed_at: new Date().toISOString() })
      .eq("id", data.order.id)
      .is("sizes_completed_at", null)
      .select("id")
      .maybeSingle();
    completedNow = Boolean(claimed);
  }
  return { ok: true, remaining, completedNow };
}
