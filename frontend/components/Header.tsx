"use client";

import Link from "next/link";
import Layout from "./AppLayout";

export default function Header() {
  return (
    <header className="w-full border-b border-gray-200 fixed top-0 bg-white z-50">
      <Layout>
        <div className="flex justify-between items-center py-3">
          <Link href="/" className="text-xl font-bold text-brand">
            E-Shop
          </Link>

          <Link href="/role" className="btn-primary">
            Sign In
          </Link>
        </div>
      </Layout>
    </header>
  );
}
