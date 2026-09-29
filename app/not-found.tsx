import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="h-display text-7xl text-flare">404</p>
      <h1 className="h-display mt-2 text-3xl">Offside. This page doesn&apos;t exist.</h1>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/build" className="btn-primary">Build your stag set</Link>
        <Link href="/designs" className="btn-ghost">See the designs</Link>
      </div>
    </div>
  );
}
