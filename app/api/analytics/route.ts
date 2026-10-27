import { NextResponse } from "next/server";

/** Retired endpoint from the previous store (replaced by /api/events and lib/store.ts). */
export function GET() {
  return NextResponse.json({ error: "Gone" }, { status: 410 });
}
export const POST = GET;
