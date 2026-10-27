"use client";

import { useEffect, useRef } from "react";
import { track, type GaItem } from "@/lib/track";
import type { ClientEventName } from "@/lib/events";

/** Fires an event once when the wrapped section scrolls into view (or on mount with `immediate`). */
export function TrackOnView({
  event,
  props,
  value,
  items,
  immediate = false,
  children,
}: {
  event: ClientEventName;
  props?: Record<string, unknown>;
  value?: number;
  items?: GaItem[];
  immediate?: boolean;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);
  useEffect(() => {
    const fire = () => {
      if (fired.current) return;
      fired.current = true;
      track(event, props, { value, items });
    };
    if (immediate || !ref.current) return fire();
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        fire();
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(ref.current);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={ref}>{children}</div>;
}
