"use client";

import Link from "next/link";
import Layout from "./AppLayout";
import { usePathname } from "next/navigation";
import { User, ShoppingCart } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const onHome = pathname !== "/"; // adjust if root path differs

  return (
    <header className="w-full border-b border-gray-200 fixed top-0 bg-white z-50">
      <Layout>
        <div className="flex justify-between items-center py-4">
          <Link href="/home" className="text-3xl font-semibold text-brand">
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
