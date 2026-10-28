"use client";

import { useEffect, useState } from "react";
import { isInternal } from "@/lib/track";

/** Small reminder that this browser is excluded from tracking (set with ?internal=1). */
export function InternalBadge() {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(isInternal()), []);
  if (!on) return null;
  return (
    <a
      href="?internal=0"
      title="Your visits aren't tracked in this browser. Click to start tracking again."
      className="fixed bottom-24 left-3 z-[70] md:bottom-3 rounded-full bg-ink/80 px-3 py-1 text-[11px] font-semibold text-chalk shadow-lift backdrop-blur"
    >
      Internal visitor · not tracked
    </a>
  );
}
