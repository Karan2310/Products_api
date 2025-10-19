"use client";

import type { CartItem } from "@/components/cart/cart-provider";

const STORAGE_KEY = "products_pending_cart_additions";
const ONE_DAY_MS = 1000 * 60 * 60 * 24;

type PendingCartEntry = {
  item: Omit<CartItem, "quantity">;
  quantity: number;
  timestamp: number;
};

const readPendingEntries = (): PendingCartEntry[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => {
        if (
          typeof entry !== "object" ||
          !entry ||
          typeof entry.item !== "object" ||
          !entry.item ||
          typeof entry.item.productId !== "string" ||
          typeof entry.item.title !== "string" ||
          typeof entry.item.price !== "number" ||
          typeof entry.quantity !== "number" ||
          typeof entry.timestamp !== "number"
        ) {
          return null;
        }

        return {
          item: {
            productId: entry.item.productId,
            title: entry.item.title,
            price: entry.item.price,
            image: entry.item.image ?? null,
            stock:
              typeof entry.item.stock === "number"
                ? Math.max(0, Math.floor(entry.item.stock))
                : undefined,
          },
          quantity: Math.max(1, Math.min(99, Math.floor(entry.quantity))),
          timestamp: entry.timestamp,
        } satisfies PendingCartEntry;
      })
      .filter(Boolean) as PendingCartEntry[];
  } catch (error) {
    console.warn("Failed to parse pending cart entries", error);
    return [];
  }
};

const writePendingEntries = (entries: PendingCartEntry[]) => {
  if (typeof window === "undefined") {
    return;
  }

  if (entries.length === 0) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const queuePendingCartItem = (item: Omit<CartItem, "quantity">, quantity: number) => {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedQuantity = Math.max(1, Math.min(99, Math.floor(quantity)));
  const entries = readPendingEntries().filter(
    (entry) => entry.item.productId !== item.productId,
  );

  entries.push({
    item: {
      productId: item.productId,
      title: item.title,
      price: item.price,
      image: item.image ?? null,
      stock:
        typeof item.stock === "number" ? Math.max(0, Math.floor(item.stock)) : undefined,
    },
    quantity: normalizedQuantity,
    timestamp: Date.now(),
  });

  writePendingEntries(entries);
};

export const consumePendingCartItems = (): Array<{
  item: Omit<CartItem, "quantity">;
  quantity: number;
}> => {
  if (typeof window === "undefined") {
    return [];
  }

  const now = Date.now();
  const entries = readPendingEntries().filter(
    (entry) => now - entry.timestamp < ONE_DAY_MS,
  );

  writePendingEntries([]);

  return entries.map((entry) => ({
    item: entry.item,
    quantity: entry.quantity,
  }));
};
