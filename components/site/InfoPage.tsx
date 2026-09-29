import Link from "next/link";

export function InfoPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 md:pt-10">
      <nav className="text-xs font-bold uppercase text-mute" aria-label="Breadcrumb">
        <Link href="/">Home</Link> / {title}
      </nav>
      <h1 className="h-display mt-2 text-5xl">{title}</h1>
      <div className="prose-simple mt-6">{children}</div>
      <div className="mt-10">
        <Link href="/build" className="btn-primary">Build your stag set →</Link>
      </div>
    </div>
  );
}
