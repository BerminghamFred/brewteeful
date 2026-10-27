"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSetStore } from "@/stores/set-store";

export function BasketButton() {
  const people = useSetStore((s) => s.people);
  const inBasket = useSetStore((s) => s.inBasket);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted && inBasket ? people.length : 0;
  return (
    <Link
      href="/basket"
      aria-label={count ? `Basket, ${count} shirts` : "Basket"}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-ink/5"
    >
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      {count ? (
        <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-flare px-1 text-[10px] font-semibold text-chalk">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
