"use client";

import { useEffect, useState } from "react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function CountdownClient({
  endIso,
  label,
}: {
  endIso: string;
  label: string;
}) {
  const [left, setLeft] = useState<string>("");

  useEffect(() => {
    const end = new Date(endIso).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, end - now);
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLeft(`${d}d ${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endIso]);

  return (
    <span>
      <span className="text-brand-accent">{label}</span>
      {left ? <span className="ml-2 font-mono tabular-nums">{left}</span> : null}
    </span>
  );
}
