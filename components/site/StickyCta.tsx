"use client";

import { useEffect, useState } from "react";
import { CtaLink } from "@/components/site/CtaLink";

/** Mobile sticky CTA once the hero CTA has scrolled away. */
export function StickyCta({ label, summary }: { label: string; summary: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 560);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className={`fixed inset-x-3 bottom-3 z-30 transition duration-300 md:hidden ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-3 rounded-full bg-ink/95 py-2 pl-5 pr-2 text-chalk shadow-lift backdrop-blur">
        <p className="flex-1 text-[13px] leading-tight text-chalk/80">{summary}</p>
        <CtaLink href="/build" location="sticky_mobile" className="btn min-h-[42px] bg-chalk px-5 text-sm text-ink">
          {label}
        </CtaLink>
      </div>
    </div>
  );
}
