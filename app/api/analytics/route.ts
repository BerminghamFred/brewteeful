import { NextResponse } from "next/server";
import { createClientOptional } from "@/lib/supabase/server";

export async function POST(req: Request) {
  let body: { name?: string; path?: string; payload?: Record<string, unknown> };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const supabase = await createClientOptional();
  if (!supabase) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  const vid =
    req.headers.get("x-visitor-id") ??
    req.headers.get("cookie")?.match(/brewteeful_vid=([^;]+)/)?.[1];
  await supabase.from("analytics_events").insert({
    name: body.name ?? "event",
    path: body.path,
    visitor_id: vid ?? null,
    payload: body.payload ?? {},
  });
  return NextResponse.json({ ok: true });
}
