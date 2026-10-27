"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Person = {
  design: string | null; // product slug
  size: string | null;
  nickname: string;
};

export type SetState = {
  people: Person[];
  eventDate: string | null; // yyyy-mm-dd
  inBasket: boolean;
  discountCode: string | null;
  shippingMethod: "standard" | "express";
  setGroupSize: (n: number) => void;
  updatePerson: (i: number, patch: Partial<Person>) => void;
  replaceAll: (people: Person[], eventDate?: string | null) => void;
  setEventDate: (d: string | null) => void;
  setInBasket: (v: boolean) => void;
  setDiscountCode: (c: string | null) => void;
  setShippingMethod: (m: "standard" | "express") => void;
  reset: () => void;
};

const blank = (): Person => ({ design: null, size: null, nickname: "" });

export const useSetStore = create<SetState>()(
  persist(
    (set) => ({
      people: [],
      eventDate: null,
      inBasket: false,
      discountCode: null,
      shippingMethod: "standard",
      setGroupSize: (n) =>
        set((s) => ({
          people: Array.from({ length: n }, (_, i) => s.people[i] ?? blank()),
        })),
      updatePerson: (i, patch) =>
        set((s) => ({
          people: s.people.map((p, j) => (j === i ? { ...p, ...patch } : p)),
        })),
      replaceAll: (people, eventDate) =>
        set((s) => ({ people, eventDate: eventDate === undefined ? s.eventDate : eventDate })),
      setEventDate: (eventDate) => set({ eventDate }),
      setInBasket: (inBasket) => set({ inBasket }),
      setDiscountCode: (discountCode) => set({ discountCode }),
      setShippingMethod: (shippingMethod) => set({ shippingMethod }),
      reset: () =>
        set({ people: [], eventDate: null, inBasket: false, discountCode: null, shippingMethod: "standard" }),
    }),
    {
      name: "stg-set-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        people: s.people,
        eventDate: s.eventDate,
        inBasket: s.inBasket,
        discountCode: s.discountCode,
        shippingMethod: s.shippingMethod,
      }),
    }
  )
);

/** Shareable lineup: ?n=8&p=slug~L~Dave,slug~XL,,&d=2026-10-24 */
export function encodeLineup(people: Person[], eventDate: string | null) {
  const params = new URLSearchParams();
  params.set("n", String(people.length));
  params.set(
    "p",
    people
      .map((p) =>
        [p.design ?? "", p.size ?? "", p.nickname ? encodeURIComponent(p.nickname.slice(0, 24)) : ""]
          .join("~")
          .replace(/~+$/, "")
      )
      .join(",")
  );
  if (eventDate) params.set("d", eventDate);
  return params.toString();
}

export function decodeLineup(
  sp: URLSearchParams,
  validDesigns: Set<string>,
  validSizes: Set<string>,
  maxGroup: number
): { people: Person[]; eventDate: string | null } | null {
  const n = Number(sp.get("n"));
  if (!Number.isInteger(n) || n < 1 || n > maxGroup) return null;
  const parts = (sp.get("p") ?? "").split(",");
  const people = Array.from({ length: n }, (_, i) => {
    const [design, size, nick] = (parts[i] ?? "").split("~");
    let nickname = "";
    try {
      nickname = nick ? decodeURIComponent(nick).slice(0, 24) : "";
    } catch {
      /* ignore malformed */
    }
    return {
      design: design && validDesigns.has(design) ? design : null,
      size: size && validSizes.has(size) ? size : null,
      nickname,
    };
  });
  const d = sp.get("d");
  return { people, eventDate: d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null };
}
