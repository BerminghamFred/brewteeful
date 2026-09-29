"use client";

import { useEffect, useState } from "react";
import { formatGbp } from "@/lib/money";
import { Button } from "@/components/ui/Button";

export function StickyProductBar({
  title,
  pricePence,
  canAdd,
  onAdd,
}: {
  title: string;
  pricePence: number;
  canAdd: boolean;
  onAdd: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => {
      if (mq.matches) setVisible(window.scrollY > 420);
      else setVisible(true);
    };
    window.addEventListener("scroll", sync, { passive: true });
    mq.addEventListener("change", sync);
    sync();
    return () => {
      window.removeEventListener("scroll", sync);
      mq.removeEventListener("change", sync);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-brand-ink/95 p-4 backdrop-blur-md md:py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{title}</p>
          <p className="text-xs text-brand-accent">{formatGbp(pricePence)}</p>
        </div>
        <Button
          variant="primary"
          className="shrink-0 px-6 py-2.5 text-xs"
          onClick={onAdd}
          disabled={!canAdd}
        >
          Add to cart
        </Button>
      </div>
    </div>
  );
}
