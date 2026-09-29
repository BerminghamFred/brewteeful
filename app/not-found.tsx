import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-32 text-center">
      <p className="font-display text-6xl text-brand-accent">404</p>
      <h1 className="mt-4 font-display text-2xl text-white">Lost in the terraces</h1>
      <p className="mt-2 text-sm text-white/55">
        This page doesn&apos;t exist — head back to the shop.
      </p>
      <Link
        href="/collection/all"
        className="mt-8 inline-block rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:border-brand-accent"
      >
        Shop all
      </Link>
    </div>
  );
}
