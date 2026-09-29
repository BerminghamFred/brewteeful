"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function RecentlyViewed({ currentSlug }: { currentSlug: string }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("brewteeful-recent");
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      setSlugs(list.filter((s) => s !== currentSlug).slice(0, 4));
    } catch {
      setSlugs([]);
    }
  }, [currentSlug]);

  if (slugs.length === 0) return null;

  return (
    <section className="mt-14 border-t border-white/10 pt-10">
      <h2 className="font-display text-2xl text-white">Recently viewed</h2>
      <ul className="mt-4 flex flex-wrap gap-3 text-sm">
        {slugs.map((s) => (
          <li key={s}>
            <Link
              href={`/product/${s}`}
              className="rounded-full border border-white/15 px-3 py-1 text-white/70 hover:border-brand-accent/50 hover:text-white"
            >
              {s.replace(/-/g, " ")}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
