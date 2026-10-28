"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { flushEvents, track } from "@/lib/track";

const MAX_SECS = 30 * 60;

/**
 * Per page: seconds the page was actually on screen and the furthest point scrolled to
 * (% of the page). Sent as `page_engagement` when the visitor navigates away, switches
 * tab or closes it — a page can report more than once (each visible stretch), so
 * reports sum the seconds and take the max scroll. Bots that load and leave report 0.
 */
export function EngagementTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    let visibleSince: number | null = document.visibilityState === "visible" ? Date.now() : null;
    let activeMs = 0;
    let maxScroll = 0;

    const measureScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const pct = scrollable <= 0 ? 100 : ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100;
      if (scrollable > 0 && window.scrollY <= 0) return; // not scrolled yet: don't credit the first screen
      maxScroll = Math.max(maxScroll, Math.min(100, Math.round(pct)));
    };

    const report = (beacon: boolean) => {
      if (visibleSince != null) activeMs += Date.now() - visibleSince;
      visibleSince = null;
      const secs = Math.min(MAX_SECS, Math.round(activeMs / 1000));
      if (secs > 0 || maxScroll > 0) {
        track("page_engagement", { secs, scroll: maxScroll }, { path: pathname });
        flushEvents(beacon);
      }
      activeMs = 0;
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") report(true);
      else visibleSince = Date.now();
    };
    const onPageHide = () => report(true);

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        measureScroll();
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      // Route change inside the app: report the page being left.
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      report(false);
    };
  }, [pathname]);

  return null;
}
