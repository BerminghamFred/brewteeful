"use client";

import Link from "next/link";
import { track } from "@/lib/track";

/** CTA that records where it was clicked, so we can see which placements work. */
export function CtaLink({
  href,
  location,
  className = "btn-primary",
  children,
}: {
  href: string;
  location: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={className} onClick={() => track("click_cta", { location, href })}>
      {children}
    </Link>
  );
}
