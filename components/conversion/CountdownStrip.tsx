import { CountdownClient } from "./CountdownClient";

export function CountdownStrip({
  settings,
}: {
  settings?: { enabled?: boolean; endIso?: string; label?: string } | null;
}) {
  if (settings?.enabled === false) return null;
  const end = settings?.endIso ?? "2026-04-30T23:59:59.000Z";
  const label = settings?.label ?? "Next drop ends";
  return (
    <div className="border-b border-white/10 bg-brand-ink py-2 text-center text-xs text-white/80">
      <CountdownClient endIso={end} label={label} />
    </div>
  );
}
