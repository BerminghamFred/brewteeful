"use client";

import { useEffect, useState } from "react";

const NAMES = ["Alex", "Jordan", "Sam", "Riley", "Casey", "Morgan"];

export function LivePurchaseToast({
  cities,
}: {
  cities: string[];
}) {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const city = cities[Math.floor(Math.random() * cities.length)] ?? "London";
      const name = NAMES[Math.floor(Math.random() * NAMES.length)]!;
      setMsg(`${name} in ${city} just grabbed a tee`);
    };
    const id = setInterval(tick, 14000);
    tick();
    return () => clearInterval(id);
  }, [cities]);

  if (!msg) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 left-4 z-30 max-w-sm rounded-lg border border-white/10 bg-brand-ink/95 px-4 py-3 text-xs text-white/90 shadow-lg md:bottom-8">
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />{" "}
      {msg}
    </div>
  );
}
