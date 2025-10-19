"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "products_cart_v1";

export type CartItem = {
  productId: string;
  title: string;
  price: number;
  image?: string | null;
  quantity: number;
  stock?: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const loadInitialState = (): CartItem[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (
          typeof item !== "object" ||
          !item ||
          typeof item.productId !== "string" ||
          typeof item.title !== "string" ||
          typeof item.price !== "number" ||
          typeof item.quantity !== "number"
        ) {
          return null;
        }

        return {
          productId: item.productId,
          title: item.title,
          price: item.price,
          image: item.image ?? null,
          quantity: Math.max(1, Math.min(99, Math.floor(item.quantity))),
          stock:
            typeof item.stock === "number" && item.stock >= 0 ? Math.floor(item.stock) : undefined,
        } satisfies CartItem;
      })
      .filter(Boolean) as CartItem[];
  } catch (error) {
    console.warn("Failed to parse cart state from storage", error);
    return [];
  }
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadInitialState());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((current) => {
        const existingIndex = current.findIndex((p) => p.productId === item.productId);
        const normalizedQuantity = Math.max(1, Math.min(99, Math.floor(quantity)));

        if (existingIndex === -1) {
          return [
            ...current,
            {
              ...item,
              quantity: normalizedQuantity,
            },
          ];
        }

        const next = [...current];
        const existing = next[existingIndex];
        const nextQuantity = Math.max(
          1,
          Math.min(99, existing.quantity + normalizedQuantity),
        );
        next[existingIndex] = {
          ...existing,
          quantity: nextQuantity,
        };

        return next;
      });
    },
    [setItems],
  );

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) =>
      current
        .map((item) => {
          if (item.productId !== productId) {
            return item;
          }

          const normalizedQuantity = Math.max(1, Math.min(99, Math.floor(quantity)));
          return {
            ...item,
            quantity: normalizedQuantity,
          };
        })
        .filter(Boolean),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((accumulator, item) => accumulator + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((accumulator, item) => accumulator + item.price * item.quantity, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalItems,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items, totalItems, subtotal, addItem, updateQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
};
