"use client";

import { useEffect, useState } from "react";
import { CtaLink } from "@/components/site/CtaLink";

/** Mobile sticky CTA once the hero CTA has scrolled away. */
export function StickyCta({ label, summary }: { label: string; summary: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-paper px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 transition-transform md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center gap-3">
        <p className="flex-1 text-xs font-bold leading-tight">{summary}</p>
        <CtaLink href="/build" location="sticky_mobile" className="btn-primary min-h-[44px] px-5 text-sm">
          {label}
        </CtaLink>
      </div>
    </div>
  );
}
