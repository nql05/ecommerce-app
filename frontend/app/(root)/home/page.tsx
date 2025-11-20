"use client";

import React, { useEffect, useRef, useState } from "react";
import ProductCard, { ProductCardProps } from "../../../components/ProductCard";

// Base dummy products (8 items as requested)
const baseProducts: Omit<ProductCardProps, "id">[] = [
  { imageUrl: "https://i5.walmartimages.com/seo/Wireless-Earbuds-Bluetooth-5-0-Headphones-IPX8-Waterproof-Hight-Fidelity-Stereo-Sound-Quality-Ear-Headset-Built-in-Mic-LED-Charging-Case-21-Hours-Pla_a7e7bef7-f039-4d00-bfe4-15676c26ad7c.24eca05c39f5baa6894dc7c693055b49.jpeg?odnHeight=573&odnWidth=573&odnBg=FFFFFF", name: "Wireless Earbuds, IPX8", price: 890000 },
  { imageUrl: "https://i5.walmartimages.com/seo/AirPods-Max-Starlight_bed55a38-17a8-4625-9fe1-421cc1a52408.1eacde98e237918a46bc33e137f8ff37.jpeg?odnHeight=2000&odnWidth=2000&odnBg=FFFFFF", name: "AirPods Max", price: 15590000 },
  { imageUrl: "https://via.placeholder.com/300?text=Bose+BT", name: "Bose BT Earphones", price: 6890000 },
  { imageUrl: "https://via.placeholder.com/300?text=VIVEFOX", name: "VIVEFOX Headphones", price: 990000 },
  { imageUrl: "https://via.placeholder.com/300?text=JBL+TUNE", name: "JBL TUNE 600BTNC", price: 1590000 },
  { imageUrl: "https://via.placeholder.com/300?text=TAGRY", name: "TAGRY Bluetooth", price: 1090000 },
  { imageUrl: "https://via.placeholder.com/300?text=Monster", name: "Monster MNFLEX", price: 897500 },
  { imageUrl: "https://via.placeholder.com/300?text=Mpow+CH6", name: "Mpow CH6", price: 5690000 }
];

// Generate a batch (re-uses base list but gives new ids & slight name suffix)
function generateBatch(batchNumber: number): ProductCardProps[] {
  const offset = (batchNumber - 1) * baseProducts.length;
  return baseProducts.map((p, index) => ({
    id: offset + index + 1,
    imageUrl: p.imageUrl,
    name: `${p.name} #${batchNumber}`,
    price: p.price
  }));
}

export default function HomePage() {
  const [batch, setBatch] = useState(1);
  const [products, setProducts] = useState<ProductCardProps[]>(() => generateBatch(1));
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore) {
          // Simulate fetch delay
          setTimeout(() => {
            setBatch((prev) => {
              const next = prev + 1;
              // Limit total batches to avoid infinite growth for now (e.g., 5 batches = 40 items)
              if (next > 5) {
                setHasMore(false);
                return prev;
              }
              setProducts((current) => [...current, ...generateBatch(next)]);
              return next;
            });
          }, 400);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore]);

  return (
    <main className="pt-32 pb-16">{/* offset for fixed header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Latest Products</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} {...p} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-10 flex items-center justify-center text-xs text-gray-500 mt-6">
        {hasMore ? "Loading more..." : "No more items"}
      </div>
    </main>
  );
}
