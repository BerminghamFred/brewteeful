import { NextResponse } from "next/server";
import { setItemSize } from "@/lib/order-sizes";
import { getSettings } from "@/lib/store";
import { sendSizesComplete } from "@/lib/email/orders";
import { hasServiceRole } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** Pay-now-sizes-later: one person sets their size on a paid order. */
export async function POST(req: Request) {
  if (!hasServiceRole()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { token?: unknown; position?: unknown; size?: unknown } | null;
  const token = typeof body?.token === "string" ? body.token : "";
  const position = typeof body?.position === "number" ? Math.round(body.position) : NaN;
  const size = typeof body?.size === "string" ? body.size : "";
  if (!token || !Number.isFinite(position)) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const settings = await getSettings();
  const r = await setItemSize(token, position, size, settings.sizing.sizes);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });

  if (r.completedNow) {
    const { data } = await createAdminClient().from("orders").select("id").eq("sizes_token", token).maybeSingle();
    if (data) await sendSizesComplete(data.id);
  }
  return NextResponse.json({ ok: true, remaining: r.remaining, complete: r.remaining === 0 });
}
