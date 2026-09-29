"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ExitIntentPopup = dynamic(
  () => import("./ExitIntentPopup").then((m) => m.ExitIntentPopup),
  { ssr: false }
);

const LivePurchaseToast = dynamic(
  () => import("./LivePurchaseToast").then((m) => m.LivePurchaseToast),
  { ssr: false }
);

export function ConversionWidgets() {
  const [exitSettings, setExitSettings] = useState<{
    enabled?: boolean;
    discountPercent?: number;
    title?: string;
    subtitle?: string;
  } | null>(null);
  const [live, setLive] = useState<{ enabled?: boolean; cities?: string[] } | null>(
    null
  );

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/site-settings");
        if (!res.ok) return;
        const data = (await res.json()) as {
          exit_popup?: Record<string, unknown>;
          live_notifications?: { enabled?: boolean; cities?: string[] };
        };
        setExitSettings(data.exit_popup ?? null);
        setLive(data.live_notifications ?? null);
      } catch {
        setExitSettings({});
        setLive({
          enabled: true,
          cities: ["London", "Manchester", "Birmingham", "Leeds", "Glasgow"],
        });
      }
    }
    load();
  }, []);

  return (
    <>
      <ExitIntentPopup settings={exitSettings} />
      {live?.enabled !== false && (
        <LivePurchaseToast
          cities={
            live?.cities ?? [
              "London",
              "Manchester",
              "Birmingham",
              "Leeds",
              "Glasgow",
            ]
          }
        />
      )}
    </>
  );
}
