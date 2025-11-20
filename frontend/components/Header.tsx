'use client';

import Link from 'next/link';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="w-full" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="container mx-auto flex justify-between items-center py-4 px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: '#16a394' }} />
          <span className="text-white font-bold text-lg">E-Shop</span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden md:block">
            <input placeholder="Search products" className="px-3 py-2 rounded bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] text-white w-64" />
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-gray-200 hover:text-white">Home</Link>
            <Link href="/cart" className="text-gray-200 hover:text-white">Cart</Link>
            {user?.role === 'seller' && <Link href="/seller" className="text-gray-200 hover:text-white">Seller</Link>}
            {user?.role === 'admin' && <Link href="/admin" className="text-gray-200 hover:text-white">Admin</Link>}
            {user ? (
              <button onClick={logout} className="ml-2 text-sm btn-primary">Logout</button>
            ) : (
              <Link href="/login" className="ml-2 text-sm btn-primary">Login</Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}