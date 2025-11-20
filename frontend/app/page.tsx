'use client';

import { useEffect, useState } from 'react';
import api from '../lib/api';
import Link from 'next/link';

export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/products').then(res => setProducts(res.data || []));
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(9,10,21)' }}>
      <div className="container mx-auto p-6">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-10">
          <div>
            <h1 className="text-4xl font-extrabold mb-4">Discover beautiful products</h1>
            <p className="text-gray-300 mb-6">Shop from trusted sellers with fast shipping and secure payments. Curated collections to match your style.</p>
            <div className="flex gap-4">
              <Link href="/product" className="btn-primary">Shop Now</Link>
              <Link href="/login" className="btn-secondary">Sign In</Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="card p-6">
              <img src="/hero-placeholder.png" alt="hero" className="w-full rounded" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.slice(0, 9).map((product: any) => (
              <div key={product.ProductID} className="card p-4">
                <div className="h-40 bg-[rgba(255,255,255,0.03)] rounded mb-4 flex items-center justify-center text-gray-300">Image</div>
                <div className="font-semibold text-white">{product.ProductName}</div>
                <div className="text-sm text-gray-400 mb-3">{product.ProductDescription}</div>
                <div className="flex justify-between items-center">
                  <Link href={`/product/${product.ProductID}`} className="text-[var(--accent)] font-semibold">View</Link>
                  <div className="text-white font-bold">${product.Price ?? '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
