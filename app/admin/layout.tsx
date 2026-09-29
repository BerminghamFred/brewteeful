import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/reviews", label: "Reviews" },
    { href: "/admin/offers", label: "Offers" },
    { href: "/admin/experiments", label: "A/B tests" },
    { href: "/admin/analytics", label: "Analytics" },
    { href: "/admin/settings", label: "Site settings" },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 md:flex-row md:px-6">
      <aside className="shrink-0 md:w-48">
        <p className="font-display text-xl text-white">Admin</p>
        <nav className="mt-4 flex flex-wrap gap-2 md:flex-col md:gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-2 py-1.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/"
          className="mt-6 inline-block text-xs text-white/40 hover:text-white/70"
        >
          ← Storefront
        </Link>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
