import Link from "next/link";
import { signOut } from "@/lib/admin/actions";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const links = [
  ["/admin", "Dashboard"],
  ["/admin/analytics", "Acquisition"],
  ["/admin/orders", "Orders"],
  ["/admin/orders/pick-list", "Pick list"],
  ["/admin/products", "Products"],
  ["/admin/offers", "Offers & codes"],
  ["/admin/spend", "Ad spend"],
  ["/admin/experiments", "Experiments"],
  ["/admin/content", "Content & settings"],
  ["/admin/reviews", "Reviews"],
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <style>{`.input{width:100%;border:1px solid rgba(14,14,16,.12);border-radius:.75rem;background:#fff;padding:.5rem .75rem;font-size:.875rem;outline:none}.input:focus{border-color:rgba(14,14,16,.4)}`}</style>
      <header className="border-b border-ink/10 bg-ink text-paper">
        <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 py-3 text-sm">
          <span className="shrink-0 font-display text-xl uppercase">Admin</span>
          <nav className="flex shrink-0 gap-3">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className="whitespace-nowrap font-bold opacity-80 hover:opacity-100">
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <Link href="/" className="opacity-70 hover:opacity-100">Storefront ↗</Link>
            <form action={signOut}>
              <button className="opacity-70 hover:opacity-100">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
    </div>
  );
}
