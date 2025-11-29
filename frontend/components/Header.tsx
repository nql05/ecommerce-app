"use client";

import Link from "next/link";
import Layout from "./AppLayout";
import { usePathname, useRouter } from "next/navigation";
import { User, ShoppingCart, LogOut } from "lucide-react";
import { useEffect, useContext, useState, useRef } from "react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const onHome = pathname !== "/"; // adjust if root path differs
  const cartContext = useContext(CartContext);
  const { user, logout } = useContext(AuthContext);
  const cartCount = cartContext?.cartCount || 0;
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const currentRole = user?.role || storedRole;

    if (onHome && currentRole === "B") cartContext?.fetchCartCount();
  }, [cartContext, onHome, user]);

  const handleLogout = () => {
    logout();
    setShowAccountMenu(false);
    router.push("/");
  };

  return (
    <header className="w-full fixed top-0 bg-brand z-50">
      <Layout>
        <div className="flex justify-between items-center py-4 min-h-[76px]">
          <Link href="/product" className="text-3xl font-semibold text-white">
            E-Shop
          </Link>
          {onHome ? (
            <div className="flex items-center gap-4">
              {user?.role === "B" && (
                <Link href="/cart" className="relative p-2" aria-label="Cart">
                  <ShoppingCart className="w-7 h-7 text-white" />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 bg-white text-brand text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-brand border-2 leading-none">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>
              )}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="p-2"
                  aria-label="Account"
                >
                  <User className="w-7 h-7 text-white" />
                </button>
                {showAccountMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-md z-50">
                    {user?.role !== "A" && (
                      <Link
                        href="/account"
                        onClick={() => setShowAccountMenu(false)}
                        className="px-4 py-3 text-gray-700 hover:bg-gray-50 transition flex items-center gap-2 rounded-t-lg"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className={`w-full text-left px-4 py-3 text-red-600 hover:bg-gray-50 transition flex items-center gap-2 ${
                        user?.role === "A" ? "rounded-lg" : "rounded-b-lg"
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link
              href="/role"
              className="bg-white text-brand px-4 py-1 rounded-full font-semibold hover:bg-gray-100 transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </Layout>
    </header>
  );
}
