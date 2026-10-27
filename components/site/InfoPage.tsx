import Link from "next/link";

export function InfoPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-10 md:px-6 md:pt-16">
      <nav className="text-[13px] text-mute" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link> <span className="mx-1">/</span> {title}
      </nav>
      <h1 className="h-display mt-4 text-5xl md:text-6xl">{title}</h1>
      <div className="prose-simple mt-8">{children}</div>
      <div className="mt-12">
        <Link href="/build" className="btn-primary">Build your stag set <span aria-hidden>→</span></Link>
      </div>
    </div>
  );
}
