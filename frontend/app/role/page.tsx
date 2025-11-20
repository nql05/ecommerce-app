"use client";

import Link from "next/link";
import { ShoppingBag, Store, Shield } from "lucide-react";

export default function RoleSelection() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-4xl w-full px-4">
        <h1 className="text-4xl font-bold text-black text-center mb-16">
          Choose Your Role
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Link
            href="/login/buyer"
            className="group flex flex-col items-center justify-center p-12 border-2 border-gray-200 rounded-2xl hover:border-brand transition-all"
          >
            <ShoppingBag
              size={64}
              className="mb-6 text-gray-400 group-hover:text-brand transition-colors"
            />
            <h2 className="text-2xl font-bold text-black">Buyer</h2>
          </Link>

          <Link
            href="/login/seller"
            className="group flex flex-col items-center justify-center p-12 border-2 border-gray-200 rounded-2xl hover:border-brand transition-all"
          >
            <Store
              size={64}
              className="mb-6 text-gray-400 group-hover:text-brand transition-colors"
            />
            <h2 className="text-2xl font-bold text-black">Seller</h2>
          </Link>

          <Link
            href="/login/admin"
            className="group flex flex-col items-center justify-center p-12 border-2 border-gray-200 rounded-2xl hover:border-brand transition-all"
          >
            <Shield
              size={64}
              className="mb-6 text-gray-400 group-hover:text-brand transition-colors"
            />
            <h2 className="text-2xl font-bold text-black">Admin</h2>
          </Link>
        </div>
      </div>
    </div>
  );
}
