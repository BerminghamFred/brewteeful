"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { COOKIES, parseConsent, serializeConsent, type Consent } from "@/lib/cookies";
import { readCookie, track } from "@/lib/track";

function loadMetaPixel() {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!id || window.fbq) return;
  /* eslint-disable */
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function (...args: unknown[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    b.head.appendChild(t);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  window.fbq!("init", id);
  window.fbq!("track", "PageView");
}

export function ConsentAndPixel() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent | null | undefined>(undefined);

  useEffect(() => {
    const c = parseConsent(readCookie(COOKIES.consent));
    setConsent(c);
    if (c?.ads) loadMetaPixel();
  }, []);

  function choose(c: Consent) {
    document.cookie = `${COOKIES.consent}=${serializeConsent(c)}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
    setConsent(c);
    window.gtag?.("consent", "update", {
      analytics_storage: c.analytics ? "granted" : "denied",
      ad_storage: c.ads ? "granted" : "denied",
      ad_user_data: c.ads ? "granted" : "denied",
      ad_personalization: c.ads ? "granted" : "denied",
    });
    window.gtag?.("set", "ads_data_redaction", !c.ads);
    if (c.ads) loadMetaPixel();
    track("consent_update", { analytics: c.analytics, ads: c.ads });
  }

  if (consent !== null || pathname.startsWith("/admin")) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      // Top on mobile so it never covers the sticky "build / checkout" bars at the bottom.
      className="fixed inset-x-3 top-3 z-[60] mx-auto max-w-md rounded-2xl border border-ink/[0.07] bg-chalk/95 p-4 shadow-lift backdrop-blur-xl md:inset-x-auto md:bottom-5 md:left-5 md:top-auto"
    >
      <p className="text-[13px] leading-snug text-ink/75">
        We use cookies to see which ads work and to show you our shirts elsewhere. Say no and the site works exactly the same.{" "}
        <Link href="/privacy" className="text-ink underline underline-offset-2">
          Privacy
        </Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => choose({ analytics: true, ads: true })}
          className="flex-1 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-chalk"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => choose({ analytics: false, ads: false })}
          className="flex-1 rounded-full border border-ink/15 px-4 py-2 text-[13px] font-semibold text-ink"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
