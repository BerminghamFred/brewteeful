"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type Settings = {
  enabled?: boolean;
  discountPercent?: number;
  title?: string;
  subtitle?: string;
};

export function ExitIntentPopup({ settings }: { settings: Settings | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (settings?.enabled === false) return;
    const key = "brewteeful-exit-popup";
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key))
      return;

    const onLeave = (e: MouseEvent) => {
      if (e.clientY > 0) return;
      setOpen(true);
      sessionStorage.setItem(key, "1");
    };

    document.addEventListener("mouseout", onLeave);
    return () => document.removeEventListener("mouseout", onLeave);
  }, [settings?.enabled]);

  if (!open) return null;

  const pct = settings?.discountPercent ?? 10;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-w-md rounded-2xl border border-white/15 bg-brand-ink p-8 shadow-2xl">
        <p className="font-display text-3xl text-white">
          {settings?.title ?? "Wait — take " + pct + "% off"}
        </p>
        <p className="mt-2 text-sm text-white/65">
          {settings?.subtitle ??
            "Street culture deserves a second look. Use code KICKOFF10 at checkout."}
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="primary" onClick={() => setOpen(false)}>
            Claim & shop
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
