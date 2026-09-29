"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { BadgeConfig, ModalConfig, Offer } from "@/lib/types";

const HIDDEN_ON = ["/build", "/basket", "/checkout", "/admin"];

/** Admin-configured floating badge + one-time modal. Never fake urgency. */
export function OfferWidgets({ offers }: { offers: Offer[] }) {
  const pathname = usePathname();
  const badge = offers.find((o) => o.kind === "badge");
  const modal = offers.find((o) => o.kind === "modal");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!modal || HIDDEN_ON.some((p) => pathname.startsWith(p))) return;
    const key = `stg_modal_${modal.id}`;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      return;
    }
    const cfg = modal.config as ModalConfig;
    const t = setTimeout(() => {
      setShowModal(true);
      try {
        localStorage.setItem(key, "1");
      } catch {}
    }, (cfg.delay_seconds ?? 8) * 1000);
    return () => clearTimeout(t);
  }, [modal, pathname]);

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;
  const b = badge?.config as BadgeConfig | undefined;
  const m = modal?.config as ModalConfig | undefined;

  return (
    <>
      {b?.text ? (
        <Link
          href={b.link || "/build"}
          className="fixed bottom-4 left-4 z-30 max-w-[70vw] rounded-full border-2 border-ink bg-sun px-4 py-2 text-xs font-extrabold uppercase shadow-hard"
        >
          {b.text}
        </Link>
      ) : null}
      {showModal && m ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 md:items-center" onClick={() => setShowModal(false)}>
          <div role="dialog" aria-modal className="card w-full max-w-md p-6 shadow-hard" onClick={(e) => e.stopPropagation()}>
            <p className="h-display text-3xl">{m.title}</p>
            <p className="mt-2 text-sm">{m.body}</p>
            {m.code ? (
              <p className="mt-4 rounded-xl border-2 border-dashed border-ink bg-paper p-3 text-center font-mono text-lg font-bold">{m.code}</p>
            ) : null}
            <div className="mt-5 flex gap-2">
              <Link href={m.cta_link || "/build"} className="btn-primary flex-1" onClick={() => setShowModal(false)}>
                {m.cta_label || "Build your set"}
              </Link>
              <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
