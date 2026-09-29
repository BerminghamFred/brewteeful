import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Stores email for abandoned-cart / Klaviyo sync — extend as needed. */
export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, stored: false });
  }

  try {
    const admin = createAdminClient();
    await admin.from("abandoned_carts").insert({
      email,
      cart: [],
    });
  } catch {
    /* ignore duplicates / errors */
  }

  return NextResponse.json({ ok: true });
}
