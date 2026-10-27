import { NextResponse } from "next/server";
import { buildQuote, parseCheckoutInput, publicQuote } from "@/lib/checkout";
import { getStorefrontContext } from "@/lib/store";

export async function POST(req: Request) {
  const input = parseCheckoutInput(await req.json().catch(() => null));
  if (!input) return NextResponse.json({ error: "Invalid set" }, { status: 400 });
  const quote = await buildQuote(input, await getStorefrontContext());
  return NextResponse.json(publicQuote(quote));
}
