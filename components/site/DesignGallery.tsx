"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/track";

type Img = { id: string; url: string; alt: string | null };

/**
 * Product gallery: tap a thumbnail to show it big; tap the big image for a full-screen
 * view (swipe / arrow keys / Esc). Portrait frame when there's an on-model shot, with
 * square shots contained on the design's colour so nothing gets cropped.
 */
export function DesignGallery({ name, color, images, portrait }: { name: string; color: string; images: Img[]; portrait: boolean }) {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = images.length;
  const go = useCallback((d: number) => setIdx((i) => (i + d + n) % n), [n]);
  const isModel = (url: string) => url.includes("/model/");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, go]);

  const main = images[idx] ?? images[0];
  if (!main) return null;
  const fit = (url: string) => (portrait && !isModel(url) ? "object-contain" : "object-cover");
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => (touchX.current = e.touches[0]?.clientX ?? null),
    onTouchEnd: (e: React.TouchEvent) => {
      const start = touchX.current;
      const end = e.changedTouches[0]?.clientX;
      touchX.current = null;
      if (start == null || end == null || Math.abs(end - start) < 40) return;
      go(end < start ? 1 : -1);
    },
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          track("view_image", { index: idx, image: main.url });
        }}
        {...swipe}
        aria-label={`Enlarge ${main.alt ?? name}`}
        className={`relative block w-full cursor-zoom-in overflow-hidden rounded-[28px] border border-ink/[0.06] ${portrait ? "aspect-[4/5]" : "aspect-square"}`}
        style={{ backgroundColor: isModel(main.url) ? "#efede7" : color }}
      >
        <Image src={main.url} alt={main.alt ?? name} fill priority sizes="(max-width: 768px) 100vw, 50vw" className={fit(main.url)} />
        {n > 1 ? (
          <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-semibold text-chalk">
            {idx + 1} / {n}
          </span>
        ) : null}
      </button>

      {n > 1 ? (
        <div className="no-scrollbar -mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Show ${img.alt ?? name}`}
              aria-current={i === idx}
              className={`relative aspect-square w-[22%] shrink-0 snap-start overflow-hidden rounded-2xl border-2 transition md:w-auto ${
                i === idx ? "border-ink" : "border-transparent opacity-80 hover:opacity-100"
              }`}
              style={{ backgroundColor: isModel(img.url) ? "#efede7" : color }}
            >
              <Image src={img.url} alt="" fill sizes="(max-width: 768px) 22vw, 10vw" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} images`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
          onClick={() => setOpen(false)}
          {...swipe}
        >
          <div className="relative h-[85vh] w-[94vw] max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Image src={main.url} alt={main.alt ?? name} fill sizes="94vw" loading="eager" className="object-contain" />
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25">
            ×
          </button>
          {n > 1 ? (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous image" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25">
                ‹
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next image" className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25">
                ›
              </button>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
                {idx + 1} / {n}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
