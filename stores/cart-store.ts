"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  trackAddToCart,
  type ContentItem,
} from "@/lib/analytics-events";

export type CartLine = {
  productId: string;
  variantId: string;
  slug: string;
  title: string;
  size: string;
  quantity: number;
  unitPricePence: number;
  imageUrl: string;
};

type CartState = {
  items: CartLine[];
  addItem: (line: CartLine) => void;
  updateQty: (variantId: string, qty: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
};

function buildContents(items: CartLine[]): ContentItem[] {
  return items.map((i) => ({
    id: i.productId,
    quantity: i.quantity,
    item_price: i.unitPricePence / 100,
  }));
}

function totalValue(items: CartLine[]) {
  return items.reduce(
    (sum, i) => sum + (i.unitPricePence / 100) * i.quantity,
    0
  );
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (line) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.variantId === line.variantId
          );
          let next: CartLine[];
          if (existing) {
            next = state.items.map((i) =>
              i.variantId === line.variantId
                ? { ...i, quantity: i.quantity + line.quantity }
                : i
            );
          } else {
            next = [...state.items, line];
          }
          trackAddToCart(buildContents(next), totalValue(next));
          return { items: next };
        });
      },
      updateQty: (variantId, qty) => {
        set((state) => {
          let next = state.items
            .map((i) =>
              i.variantId === variantId ? { ...i, quantity: qty } : i
            )
            .filter((i) => i.quantity > 0);
          return { items: next };
        });
      },
      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }));
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: "brewteeful-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    }
  )
);
