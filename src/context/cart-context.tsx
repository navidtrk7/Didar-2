"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CatalogProduct } from "@/data/catalog";
import { LIVE_GOLD } from "@/data/mock";
import { gramPriceFrom18 } from "@/lib/tgju";

export interface CartItem {
  product: CatalogProduct;
  quantity: number;
}

export interface CartTotals {
  totalItems: number;
  totalWeightGrams: number;
  rawMetalValue: number;
  totalCraftFee: number;
  grandTotal: number;
}

export interface CartState {
  items: CartItem[];
  addItem: (product: CatalogProduct, quantity?: number) => void;
  removeItem: (slug: string) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  totalItems: number;
  totalWeightGrams: number;
  calculateTotals: (liveRate?: number) => CartTotals;
}

const CartContext = createContext<CartState | null>(null);
const STORAGE_CART_KEY = "didar.cart.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_CART_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  const addItem = useCallback((product: CatalogProduct, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.slug === product.slug);
      if (existing) {
        return prev.map((item) =>
          item.product.slug === product.slug
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => prev.filter((item) => item.product.slug !== slug));
  }, []);

  const updateQuantity = useCallback((slug: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.product.slug !== slug));
    } else {
      setItems((prev) =>
        prev.map((item) =>
          item.product.slug === slug ? { ...item, quantity } : item,
        ),
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const totalWeightGrams = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.product.weightGrams * item.quantity,
        0,
      ),
    [items],
  );

  const calculateTotals = useCallback(
    (liveRate = LIVE_GOLD.pricePerGram): CartTotals => {
      const pricePerGram = gramPriceFrom18(liveRate, 18);
      let rawMetalValue = 0;
      let totalCraftFee = 0;

      for (const item of items) {
        const itemMetal = item.product.weightGrams * pricePerGram * item.quantity;
        const itemCraft = item.product.estimatedCraftFee * item.quantity;
        rawMetalValue += itemMetal;
        totalCraftFee += itemCraft;
      }

      return {
        totalItems,
        totalWeightGrams,
        rawMetalValue,
        totalCraftFee,
        grandTotal: rawMetalValue + totalCraftFee,
      };
    },
    [items, totalItems, totalWeightGrams],
  );

  const value = useMemo<CartState>(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isCartOpen,
      openCart,
      closeCart,
      toggleCart,
      totalItems,
      totalWeightGrams,
      calculateTotals,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isCartOpen,
      openCart,
      closeCart,
      toggleCart,
      totalItems,
      totalWeightGrams,
      calculateTotals,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
