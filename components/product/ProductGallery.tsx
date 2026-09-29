"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({
  title,
  images,
}: {
  title: string;
  images: { id: string; url: string; alt: string | null }[];
}) {
  const [idx, setIdx] = useState(0);
  const main = images[idx] ?? images[0];
  if (!main) return null;
  return (
    <div className="space-y-4">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-brand-ink">
        <Image
          src={main.url}
          alt={main.alt ?? title}
          fill
          priority
          className="object-cover"
          sizes="(max-width:1024px) 100vw, 50vw"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((im, i) => (
            <button
              key={im.id}
              type="button"
              onClick={() => setIdx(i)}
              className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border transition ${
                i === idx
                  ? "border-brand-accent ring-1 ring-brand-accent"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <Image
                src={im.url}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
