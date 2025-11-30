"use client";

import { createContext, useState, useCallback, ReactNode } from "react";
import api from "../lib/api";
import { API_PATHS } from "../lib/apiPath";

export interface CartContextType {
  cartCount: number;
  setCartCount: (count: number) => void;
  fetchCartCount: () => Promise<void>;
}

export const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = useCallback(async () => {
    try {
      const res = await api.get(API_PATHS.BUYER.CART.GET);
      const count = res.data?.StoredSKU?.length || 0; // Count unique SKUs
      setCartCount(count);
    } catch (err: any) {
      // Silently fail for cart count - don't interrupt user experience
      // Only log error for debugging purposes
      console.error("Error fetching cart count:", err);
    }
  }, []);

  return (
    <CartContext.Provider
      value={{ cartCount, setCartCount, fetchCartCount }}
    >
      {children}
    </CartContext.Provider>
  );
}
