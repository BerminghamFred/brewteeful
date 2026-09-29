"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { STOREFRONT_TAG } from "@/lib/store";
import { DEFAULT_SETTINGS, SETTINGS_KEYS, type SettingsKey } from "@/lib/settings";
import { parseSpendCsv } from "@/lib/spend-csv";
import { createClient } from "@/lib/supabase/server";

const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
};
const optStr = (f: FormData, k: string) => str(f, k) || null;
const int = (f: FormData, k: string) => {
  const v = str(f, k);
  return v === "" ? null : Math.round(Number(v));
};
const pounds = (f: FormData, k: string) => {
  const v = str(f, k).replace(/[£,]/g, "");
  return v === "" ? null : Math.round(Number(v) * 100);
};
const bool = (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true";
const dt = (f: FormData, k: string) => {
  const v = str(f, k);
  return v ? new Date(v).toISOString() : null;
};

function done(path: string, error?: string): never {
  revalidatePath(path);
  redirect(`${path}${path.includes("?") ? "&" : "?"}${error ? `error=${encodeURIComponent(error)}` : "saved=1"}`);
}

function storefrontChanged() {
  revalidateTag(STOREFRONT_TAG);
}

export async function signOut() {
  const sb = await createClient();
  await sb.auth.signOut();
  redirect("/admin/login");
}

// ---------------------------------------------------------------- products
export async function saveProduct(f: FormData) {
  const db = await requireAdmin();
  const id = optStr(f, "id");
  const slug = str(f, "slug").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  const name = str(f, "name");
  const price = pounds(f, "price");
  const back = id ? `/admin/products/${id}` : "/admin/products/new";
  if (!slug || !name || price == null) done(back, "Name, slug and price are required.");
  const compare = pounds(f, "compare_at_price");
  if (compare != null && compare <= price!) done(back, "Compare-at price must be higher than the price (and genuinely charged before).");

  const row = {
    slug,
    name,
    collection_id: optStr(f, "collection_id"),
    tagline: optStr(f, "tagline"),
    description: optStr(f, "description"),
    price_pence: price!,
    compare_at_price_pence: compare,
    cost_pence: pounds(f, "cost") ?? 0,
    status: ["draft", "active", "archived"].includes(str(f, "status")) ? str(f, "status") : "draft",
    sort_order: int(f, "sort_order") ?? 0,
    hero_image_url: optStr(f, "hero_image_url"),
    accent_color: str(f, "accent_color") || "#1f6f43",
    seo_title: optStr(f, "seo_title"),
    seo_description: optStr(f, "seo_description"),
  };

  let productId = id;
  if (id) {
    const { error } = await db.from("products").update(row).eq("id", id);
    if (error) done(back, error.message);
  } else {
    const { data, error } = await db.from("products").insert(row).select("id").single();
    if (error || !data) done(back, error?.message ?? "Insert failed");
    productId = data!.id;
  }

  // Sizes: keep existing variants (order history references them), add new, deactivate removed.
  const sizes = str(f, "sizes")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const { data: existing } = await db.from("product_variants").select("id, size").eq("product_id", productId!);
  const have = new Map((existing ?? []).map((v) => [v.size as string, v.id as string]));
  const toInsert = sizes
    .filter((s) => !have.has(s))
    .map((size) => ({ product_id: productId, size, sku: `${slug.toUpperCase().slice(0, 12)}-${size}` }));
  if (toInsert.length) await db.from("product_variants").insert(toInsert);
  for (const [size, vid] of have) await db.from("product_variants").update({ active: sizes.includes(size) }).eq("id", vid);

  // Images: one URL per line, in display order.
  const urls = str(f, "images")
    .split(/\r?\n/)
    .map((u) => u.trim())
    .filter(Boolean);
  await db.from("product_images").delete().eq("product_id", productId!);
  if (urls.length)
    await db.from("product_images").insert(urls.map((url, i) => ({ product_id: productId, url, alt: `${name} T-shirt`, sort_order: i })));

  storefrontChanged();
  done(`/admin/products/${productId}`);
}

// ---------------------------------------------------------------- orders
export async function updateOrder(f: FormData) {
  const db = await requireAdmin();
  const id = str(f, "id");
  const fulfilment = str(f, "fulfilment_status");
  const patch: Record<string, unknown> = {
    fulfilment_status: fulfilment,
    carrier: optStr(f, "carrier"),
    tracking_number: optStr(f, "tracking_number"),
    tracking_url: optStr(f, "tracking_url"),
    admin_notes: optStr(f, "admin_notes"),
  };
  if (fulfilment === "shipped" && !str(f, "shipped_at")) patch.shipped_at = new Date().toISOString();
  const { error } = await db.from("orders").update(patch).eq("id", id);
  done(`/admin/orders/${id}`, error?.message);
}

export async function bulkFulfilment(f: FormData) {
  const db = await requireAdmin();
  const ids = f.getAll("ids").filter((x): x is string => typeof x === "string");
  const to = str(f, "to");
  if (ids.length && ["in_production", "shipped", "delivered"].includes(to)) {
    await db
      .from("orders")
      .update({ fulfilment_status: to, ...(to === "shipped" ? { shipped_at: new Date().toISOString() } : {}) })
      .in("id", ids);
  }
  done("/admin/orders/pick-list");
}

// ---------------------------------------------------------------- offers & codes
export async function saveOffer(f: FormData) {
  const db = await requireAdmin();
  const kind = str(f, "kind");
  let config: Record<string, unknown>;
  switch (kind) {
    case "banner":
    case "badge":
      config = { text: str(f, "text"), link: optStr(f, "link") };
      break;
    case "modal":
      config = {
        title: str(f, "title"),
        body: str(f, "body"),
        cta_label: optStr(f, "cta_label"),
        cta_link: optStr(f, "cta_link"),
        code: optStr(f, "code")?.toUpperCase() ?? null,
        delay_seconds: int(f, "delay_seconds") ?? 8,
      };
      break;
    case "quantity_discount":
      config = {
        min_items: int(f, "min_items") ?? 0,
        amount_off_pence: pounds(f, "amount_off"),
        percent_off: int(f, "percent_off"),
        label: str(f, "label"),
      };
      break;
    case "free_shipping":
      config = { min_items: int(f, "min_items") ?? 0, label: str(f, "label") || "Free delivery" };
      break;
    default:
      done("/admin/offers", "Unknown offer type");
  }
  const row = {
    name: str(f, "name") || kind,
    kind,
    config,
    starts_at: dt(f, "starts_at"),
    ends_at: dt(f, "ends_at"),
    active: bool(f, "active"),
    priority: int(f, "priority") ?? 0,
  };
  const id = optStr(f, "id");
  const { error } = id ? await db.from("offers").update(row).eq("id", id) : await db.from("offers").insert(row);
  storefrontChanged();
  done("/admin/offers", error?.message);
}

export async function toggleOffer(f: FormData) {
  const db = await requireAdmin();
  await db.from("offers").update({ active: bool(f, "active") }).eq("id", str(f, "id"));
  storefrontChanged();
  done("/admin/offers");
}

export async function deleteOffer(f: FormData) {
  const db = await requireAdmin();
  await db.from("offers").delete().eq("id", str(f, "id"));
  storefrontChanged();
  done("/admin/offers");
}

export async function saveDiscountCode(f: FormData) {
  const db = await requireAdmin();
  const kind = str(f, "kind");
  const raw = str(f, "value");
  const value = kind === "fixed" ? Math.round(Number(raw || 0) * 100) : Math.round(Number(raw || 0));
  const row = {
    code: str(f, "code").toUpperCase().replace(/\s/g, ""),
    kind,
    value,
    min_items: int(f, "min_items") ?? 0,
    starts_at: dt(f, "starts_at"),
    ends_at: dt(f, "ends_at"),
    max_uses: int(f, "max_uses"),
    active: bool(f, "active"),
  };
  if (!row.code) done("/admin/offers", "Code required");
  const id = optStr(f, "id");
  const { error } = id ? await db.from("discount_codes").update(row).eq("id", id) : await db.from("discount_codes").insert(row);
  done("/admin/offers", error?.message);
}

export async function toggleDiscountCode(f: FormData) {
  const db = await requireAdmin();
  await db.from("discount_codes").update({ active: bool(f, "active") }).eq("id", str(f, "id"));
  done("/admin/offers");
}

// ---------------------------------------------------------------- ad spend
export async function addSpend(f: FormData) {
  const db = await requireAdmin();
  const spend = pounds(f, "spend");
  if (!str(f, "date") || spend == null) done("/admin/spend", "Date and spend required");
  const { error } = await db.from("ad_spend").insert({
    date: str(f, "date"),
    channel: str(f, "channel") || "google_ads",
    campaign: optStr(f, "campaign"),
    ad_group: optStr(f, "ad_group"),
    keyword: optStr(f, "keyword"),
    spend_pence: spend,
    clicks: int(f, "clicks"),
    impressions: int(f, "impressions"),
    source: "manual",
  });
  done("/admin/spend", error?.message);
}

export async function importSpendCsv(f: FormData) {
  const db = await requireAdmin();
  const file = f.get("file");
  const text = file instanceof File && file.size ? await file.text() : str(f, "csv");
  const { rows, errors } = parseSpendCsv(text, optStr(f, "fallback_date") ?? undefined);
  if (!rows.length) done("/admin/spend", errors[0] ?? "No rows found");
  if (bool(f, "replace")) {
    const dates = [...new Set(rows.map((r) => r.date))];
    await db.from("ad_spend").delete().in("date", dates).eq("source", "csv");
  }
  const { error } = await db.from("ad_spend").insert(rows.map((r) => ({ ...r, channel: "google_ads", source: "csv" })));
  done("/admin/spend", error?.message ?? (errors.length ? `Imported ${rows.length} rows; ${errors.length} skipped` : undefined));
}

export async function deleteSpend(f: FormData) {
  const db = await requireAdmin();
  await db.from("ad_spend").delete().eq("id", str(f, "id"));
  done("/admin/spend");
}

// ---------------------------------------------------------------- experiments
export async function saveExperiment(f: FormData) {
  const db = await requireAdmin();
  const variable = str(f, "variable");
  let variants: unknown;
  try {
    variants = JSON.parse(str(f, "variants"));
    if (!Array.isArray(variants) || variants.length < 2) throw new Error();
  } catch {
    done("/admin/experiments", "Variants must be a JSON array with at least a control and one variant.");
  }
  const row = {
    key: str(f, "key").toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    name: str(f, "name"),
    hypothesis: optStr(f, "hypothesis"),
    variable,
    variants,
  };
  const id = optStr(f, "id");
  const { error } = id ? await db.from("experiments").update(row).eq("id", id) : await db.from("experiments").insert(row);
  storefrontChanged();
  done(id ? `/admin/experiments/${id}` : "/admin/experiments", error?.message);
}

export async function setExperimentStatus(f: FormData) {
  const db = await requireAdmin();
  const id = str(f, "id");
  const status = str(f, "status");
  const patch: Record<string, unknown> = { status };
  if (status === "running") patch.started_at = new Date().toISOString();
  if (status === "ended") {
    patch.ended_at = new Date().toISOString();
    patch.winner = optStr(f, "winner");
  }
  const { error } = await db.from("experiments").update(patch).eq("id", id);
  storefrontChanged();
  done(`/admin/experiments/${id}`, error?.code === "23505" ? "Another experiment on the same variable is already running." : error?.message);
}

// ---------------------------------------------------------------- content & settings
export async function saveSettings(f: FormData) {
  const db = await requireAdmin();
  const key = str(f, "key") as SettingsKey;
  if (!SETTINGS_KEYS.includes(key)) done("/admin/content", "Unknown settings group");
  const defaults = DEFAULT_SETTINGS[key] as Record<string, unknown>;
  const value: Record<string, unknown> = {};
  for (const [field, def] of Object.entries(defaults)) {
    const name = `f_${field}`;
    if (typeof def === "boolean") value[field] = bool(f, name);
    else if (typeof def === "number") value[field] = Number(str(f, name) || 0);
    else if (typeof def === "string") value[field] = str(f, name);
    else {
      try {
        value[field] = JSON.parse(str(f, name));
      } catch {
        done(`/admin/content#${key}`, `"${field}" isn't valid JSON`);
      }
    }
  }
  const { error } = await db.from("site_settings").upsert({ key, value });
  storefrontChanged();
  done(`/admin/content`, error?.message);
}

export async function saveFaq(f: FormData) {
  const db = await requireAdmin();
  const row = { question: str(f, "question"), answer: str(f, "answer"), sort_order: int(f, "sort_order") ?? 0, active: bool(f, "active") };
  const id = optStr(f, "id");
  const { error } = id ? await db.from("faqs").update(row).eq("id", id) : await db.from("faqs").insert(row);
  storefrontChanged();
  done("/admin/content", error?.message);
}

export async function deleteFaq(f: FormData) {
  const db = await requireAdmin();
  await db.from("faqs").delete().eq("id", str(f, "id"));
  storefrontChanged();
  done("/admin/content");
}

// ---------------------------------------------------------------- reviews (genuine only)
export async function saveReview(f: FormData) {
  const db = await requireAdmin();
  const orderNumber = int(f, "order_number");
  let orderId: string | null = null;
  if (orderNumber) {
    const { data } = await db.from("orders").select("id").eq("order_number", orderNumber).in("status", ["paid", "partially_refunded"]).maybeSingle();
    if (!data) done("/admin/reviews", `No paid order #${orderNumber}`);
    orderId = data!.id;
  }
  const { error } = await db.from("reviews").insert({
    order_id: orderId,
    verified: Boolean(orderId),
    author_name: str(f, "author_name"),
    rating: Math.min(5, Math.max(1, int(f, "rating") ?? 5)),
    body: optStr(f, "body"),
    approved: bool(f, "approved"),
  });
  storefrontChanged();
  done("/admin/reviews", error?.message);
}

export async function toggleReview(f: FormData) {
  const db = await requireAdmin();
  await db.from("reviews").update({ approved: bool(f, "approved") }).eq("id", str(f, "id"));
  storefrontChanged();
  done("/admin/reviews");
}
