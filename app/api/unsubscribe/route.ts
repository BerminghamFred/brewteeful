import { NextResponse } from "next/server";
import { unsubscribeByOrder } from "@/lib/recovery";

export const runtime = "nodejs";

/** Link in the reminder email. */
export async function GET(req: Request) {
  const o = new URL(req.url).searchParams.get("o") ?? "";
  await unsubscribeByOrder(o).catch(() => false);
  return NextResponse.redirect(new URL("/unsubscribed", req.url), 303);
}

/** RFC 8058 one-click unsubscribe (mail apps POST to the List-Unsubscribe URL). */
export async function POST(req: Request) {
  const o = new URL(req.url).searchParams.get("o") ?? "";
  await unsubscribeByOrder(o).catch(() => false);
  return new NextResponse(null, { status: 204 });
}
