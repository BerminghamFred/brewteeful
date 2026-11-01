import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/supabase/public";
import { COOKIES } from "@/lib/cookies";
import { isBot } from "@/lib/events";
import { sendEmail } from "@/lib/email/send";
import { savedLineupEmail } from "@/lib/email/templates";
import { getSettings } from "@/lib/store";
import { BRAND } from "@/lib/brand";

export const runtime = "nodejs";

/** "Email me this lineup": stores the lead and emails the organiser their lineup link. */
export async function POST(req: Request) {
  if (isBot(req.headers.get("user-agent"))) return NextResponse.json({ ok: true });
  const body = (await req.json().catch(() => null)) as { email?: unknown; url?: unknown; groupSize?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().slice(0, 200) : "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  // Only ever email links to our own builder.
  let url: URL;
  try {
    url = new URL(typeof body?.url === "string" ? body.url : "");
  } catch {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }
  if (url.pathname !== "/build") return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  const link = `${BRAND.siteUrl}/build${url.search}`.slice(0, 2000);
  const groupSize = typeof body?.groupSize === "number" && Number.isFinite(body.groupSize) ? Math.round(body.groupSize) : null;

  const jar = await cookies();
  // Real browsers only (they always carry our session cookie) — stops drive-by email spam.
  if (!jar.get(COOKIES.session)?.value) return NextResponse.json({ error: "No session" }, { status: 400 });
  if (hasServiceRole()) {
    const sid = jar.get(COOKIES.session)?.value;
    const { error } = await createAdminClient()
      .from("saved_lineups")
      .insert({
        email,
        lineup_url: link,
        group_size: groupSize,
        visitor_id: jar.get(COOKIES.visitor)?.value ?? null,
        session_id: sid && /^[0-9a-f-]{36}$/i.test(sid) ? sid : null,
      });
    if (error) console.error("saved_lineups insert", error);
  }

  const settings = await getSettings();
  const msg = savedLineupEmail({ link, groupSize, settings });
  await sendEmail({ to: email, ...msg, replyTo: settings.contact.email });
  return NextResponse.json({ ok: true });
}
