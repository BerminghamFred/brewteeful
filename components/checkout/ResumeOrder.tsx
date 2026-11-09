"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSetStore, type Person } from "@/stores/set-store";
import { track } from "@/lib/track";

export function ResumeOrder({ people, email, eventDate }: { people: Person[]; email: string | null; eventDate: string | null }) {
  const router = useRouter();
  useEffect(() => {
    if (!people.length) return;
    const s = useSetStore.getState();
    s.replaceAll(people, eventDate);
    s.setInBasket(true);
    if (email) s.setEmail(email);
    track("resume_checkout", { group_size: people.length });
    router.replace("/basket");
  }, [people, email, eventDate, router]);

  if (!people.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="h-display text-4xl">That set has changed.</h1>
        <p className="mt-3 text-ink/70">One of the designs isn&apos;t available any more. Pick again — it only takes a minute.</p>
        <Link href="/designs" className="btn-primary mt-6">See the designs</Link>
      </div>
    );
  }
  return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-mute">Loading your order…</div>;
}
