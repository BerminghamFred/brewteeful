import Link from "next/link";

export const metadata = { title: "Unsubscribed", robots: { index: false } };

export default function UnsubscribedPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="h-display text-4xl">You&apos;re unsubscribed.</h1>
      <p className="mt-3 text-ink/70">We won&apos;t send you any more reminders. If you do place an order, you&apos;ll still get your receipt and delivery updates.</p>
      <Link href="/" className="btn-primary mt-6">Back to the shop</Link>
    </div>
  );
}
