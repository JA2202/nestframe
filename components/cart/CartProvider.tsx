"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

type CartItemSource = "catalogue" | "generated";

export type CartItem = {
  id: string; // local id for React
  productId: string;
  productTitle: string;
  imageUrl: string | null;
  variantId: string;
  format: string;
  sizeLabel: string;
  frameColor: string | null;
  unitPriceCents: number;
  quantity: number;
  source: CartItemSource;
  generatedArtId?: string | null;
};

type CartState = {
  items: CartItem[];
  totalCents: number;
  addItem: (item: Omit<CartItem, "id" | "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartState | undefined>(undefined);

const STORAGE_KEY = "nestframe_cart";

function loadInitialCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as CartItem[];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load from localStorage on first mount
  useEffect(() => {
    const initial = loadInitialCart();
    setItems(initial);
  }, []);

  // Persist to localStorage whenever items change
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const totalCents = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0),
    [items]
  );

  const addItem: CartState["addItem"] = (item, quantity = 1) => {
    setItems(prev => {
      // merge if same variant/source/generatedArtId
      const existingIndex = prev.findIndex(
        p =>
          p.variantId === item.variantId &&
          p.source === item.source &&
          p.generatedArtId === item.generatedArtId
      );

      if (existingIndex !== -1) {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          quantity: copy[existingIndex].quantity + quantity,
        };
        return copy;
      }

      return [
        ...prev,
        {
          ...item,
          id: crypto.randomUUID(),
          quantity,
        },
      ];
    });
  };

  const removeItem: CartState["removeItem"] = id => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart: CartState["clearCart"] = () => {
    setItems([]);
  };

  const value: CartState = {
    items,
    totalCents,
    addItem,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}