import { NextResponse } from "next/server";
import { createClientOptional } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClientOptional();
  if (!supabase) {
    return NextResponse.json({
      exit_popup: {
        enabled: true,
        discountPercent: 10,
        title: "Wait — take 10% off",
        subtitle: "Use code KICKOFF10 at checkout.",
      },
      live_notifications: {
        enabled: true,
        cities: ["London", "Manchester", "Birmingham", "Leeds", "Glasgow"],
      },
    });
  }
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["exit_popup", "live_notifications"]);

  const out: Record<string, Record<string, unknown>> = {};
  for (const row of data ?? []) {
    out[row.key] = row.value as Record<string, unknown>;
  }
  return NextResponse.json({
    exit_popup: out.exit_popup,
    live_notifications: out.live_notifications,
  });
}
