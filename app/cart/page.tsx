import Link from "next/link";
import { CartClient } from "@/components/cart/CartClient";

export const metadata = {
  title: "Cart",
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <h1 className="font-display text-5xl text-white">Your cart</h1>
      <p className="mt-2 text-white/55">Minimal checkout. No surprises.</p>
      <CartClient />
      <p className="mt-8 text-center text-sm text-white/45">
        <Link href="/collection/all" className="text-brand-accent hover:underline">
          Continue shopping
        </Link>
      </p>
    </div>
  );
}
