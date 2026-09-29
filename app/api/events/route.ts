import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/supabase/public";
import { COOKIES } from "@/lib/cookies";
import {
  ATTRIBUTION_KEYS,
  deviceFromUa,
  isBot,
  isClientEvent,
  type SessionAttribution,
} from "@/lib/events";
import { getRunningExperiments, parseForced } from "@/lib/store";
import { resolveExperiments } from "@/lib/ab";

type Body = {
  events?: { name: string; path?: string; props?: Record<string, unknown>; value_pence?: number }[];
  session?: SessionAttribution;
};

const clip = (v: unknown, n = 500) => (typeof v === "string" ? v.slice(0, n) : null);

/** First-party event ingestion. Browsers never write to the DB directly. */
export async function POST(req: Request) {
  if (!hasServiceRole()) return NextResponse.json({ ok: true, skipped: "no_db" });
  const ua = req.headers.get("user-agent");
  if (isBot(ua)) return NextResponse.json({ ok: true, skipped: "bot" });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const jar = await cookies();
  const visitorId = jar.get(COOKIES.visitor)?.value;
  const sessionId = jar.get(COOKIES.session)?.value;
  if (!visitorId || !sessionId || !/^[0-9a-f-]{36}$/i.test(sessionId))
    return NextResponse.json({ ok: true, skipped: "no_ids" });

  const db = createAdminClient();

  if (body.session) {
    const running = await getRunningExperiments();
    const { assignments } = resolveExperiments(running, visitorId, parseForced(jar.get(COOKIES.force)?.value));
    const row: Record<string, unknown> = {
      id: sessionId,
      visitor_id: visitorId,
      landing_page: clip(body.session.landing_page),
      referrer: clip(body.session.referrer),
      device: deviceFromUa(ua),
      experiments: assignments,
    };
    for (const k of ATTRIBUTION_KEYS) row[k] = clip(body.session[k], 300);
    const { error } = await db.from("visitor_sessions").upsert(row, { onConflict: "id", ignoreDuplicates: true });
    if (error) console.error("session upsert", error);
  }

  const events = (body.events ?? [])
    .slice(0, 25)
    .filter((e) => isClientEvent(e.name))
    .map((e) => ({
      name: e.name,
      visitor_id: visitorId,
      session_id: sessionId,
      path: clip(e.path, 300),
      props: e.props && typeof e.props === "object" ? e.props : {},
      value_pence: Number.isFinite(e.value_pence) ? Math.round(e.value_pence!) : null,
    }));
  if (events.length) {
    const { error } = await db.from("events").insert(events);
    if (error) console.error("events insert", error);
  }
  return NextResponse.json({ ok: true });
}
