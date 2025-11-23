"use client";

import Link from "next/link";
import Layout from "./AppLayout";
import { usePathname } from "next/navigation";
import { User, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../lib/api";
import { API_PATHS } from "../lib/apiPath";

export default function Header() {
  const pathname = usePathname();
  const onHome = pathname !== "/"; // adjust if root path differs
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (onHome) {
      fetchCartCount();
    }
  }, [onHome, pathname]);

  const fetchCartCount = async () => {
    try {
      const res = await api.get(API_PATHS.BUYER.CART.GET);
      const count = res.data?.StoredSKU?.length || 0;
      setCartCount(count);
    } catch (err) {
      setCartCount(0);
    }
  };

  return (
    <header className="w-full border-b border-gray-200 fixed top-0 bg-white z-50">
      <Layout>
        <div className="flex justify-between items-center py-4">
          <Link href="/product" className="text-3xl font-semibold text-brand">
            E-Shop
          </Link>
          {onHome ? (
            <div className="flex items-center gap-4">
              <Link
                href="/account"
                className="p-2 rounded-md hover:bg-gray-100 transition"
                aria-label="Account"
              >
                <User className="w-7 h-7 text-brand" />
              </Link>
              <Link
                href="/cart"
                className="relative p-2 rounded-md hover:bg-gray-100 transition"
                aria-label="Cart"
              >
                <ShoppingCart className="w-7 h-7 text-brand" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            </div>
          ) : (
            <Link href="/role" className="btn-primary">
              Sign In
            </Link>
          )}
        </div>
      </Layout>
    </header>
  );
}
