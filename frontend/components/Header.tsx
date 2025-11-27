"use client";

import Link from "next/link";
import Layout from "./AppLayout";
import { usePathname } from "next/navigation";
import { User, ShoppingCart } from "lucide-react";
import { useEffect, useContext } from "react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";

export default function Header() {
  const pathname = usePathname();
  const onHome = pathname !== "/"; // adjust if root path differs
  const cartContext = useContext(CartContext);
  const authContext = useContext(AuthContext);
  const cartCount = cartContext?.cartCount || 0;
  const user = authContext?.user;

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const currentRole = user?.role || storedRole;

    if (onHome && currentRole === "B") cartContext?.fetchCartCount();
  }, [cartContext, onHome, user]);

  return (
    <header className="w-full border-b border-gray-200 fixed top-0 bg-white z-50">
      <Layout>
        <div className="flex justify-between items-center py-4">
          <Link href="/product" className="text-3xl font-semibold text-brand">
            E-Shop
          </Link>
          {onHome ? (
            <div className="flex items-center gap-4">
              {user?.role === "B" && (
                <Link
                  href="/cart"
                  className="relative p-2 rounded-md hover:bg-gray-100 transition"
                  aria-label="Cart"
                >
                  <ShoppingCart className="w-7 h-7 text-brand" />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 bg-brand text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-white border-2 leading-none">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>
              )}
              <Link
                href="/account"
                className="p-2 rounded-md hover:bg-gray-100 transition"
                aria-label="Account"
              >
                <User className="w-7 h-7 text-brand" />
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
