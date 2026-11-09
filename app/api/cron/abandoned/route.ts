import { NextResponse } from "next/server";
import { runAbandonedCheckouts } from "@/lib/recovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Called every 10 minutes by Supabase pg_cron (supabase/cron/abandoned_checkouts.sql).
 * Public on purpose: it only ever sends what's due, once, so calling it early or twice
 * changes nothing.
 */
async function handle() {
  try {
    const results = await runAbandonedCheckouts();
    return NextResponse.json({ ok: true, results });
  } catch (e) {
    console.error("abandoned checkouts", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
export const GET = handle;
export const POST = handle;
