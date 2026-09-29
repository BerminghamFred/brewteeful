import Link from "next/link";
import { CheckoutSuccessTracker } from "@/components/checkout/CheckoutSuccessTracker";

export const metadata = {
  title: "Thank you",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const sp = await searchParams;
  const sessionId = sp.session_id;

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center md:py-32">
      <p className="font-display text-5xl text-brand-accent">Thank you</p>
      <h1 className="mt-4 font-display text-3xl text-white">Order confirmed</h1>
      <p className="mt-4 text-sm text-white/65">
        You&apos;ll get a confirmation email from Stripe with your receipt.
      </p>
      {sessionId ? <CheckoutSuccessTracker sessionId={sessionId} /> : null}
      <Link
        href="/collection/all"
        className="mt-10 inline-block rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:border-brand-accent"
      >
        Keep shopping
      </Link>
    </div>
  );
}
