"use client";

import React, { useEffect, useRef, useState } from "react";
import ProductCard, { ProductCardProps } from "../../../components/ProductCard";
import api from "../../../lib/api";
import { API_PATHS } from "../../../lib/apiPath";

export default function HomePage() {
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchProducts = async (pageNum: number) => {
    try {
      setLoading(true);
      const response = await api.get(API_PATHS.BUYER.PRODUCTS.LIST);
      const fetchedProducts = response.data;

      // Transform database products to ProductCardProps format
      const transformedProducts: ProductCardProps[] = fetchedProducts.map(
        (product: any) => {
          // Get the first SKU image or use placeholder
          const firstSku = product.SKU?.[0];
          const imageUrl =
            firstSku?.SKUImage?.[0]?.SKU_URL ||
            "https://via.placeholder.com/300?text=No+Image";
          const price = firstSku?.Price || 0;

          return {
            id: product.ProductID,
            imageUrl,
            name: product.ProductName,
            price,
          };
        }
      );

      // Simulate pagination by slicing
      const itemsPerPage = 8;
      const start = pageNum * itemsPerPage;
      const end = start + itemsPerPage;
      const pageProducts = transformedProducts.slice(start, end);

      if (pageProducts.length === 0 || end >= transformedProducts.length) {
        setHasMore(false);
      }

      setProducts((prev) =>
        pageNum === 0 ? pageProducts : [...prev, ...pageProducts]
      );
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(0);
  }, []);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading) {
          setPage((prev) => {
            const nextPage = prev + 1;
            fetchProducts(nextPage);
            return nextPage;
          });
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  return (
    <main className="pt-32 pb-16">
      {/* offset for fixed header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Latest Products</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((p, index) => (
          <ProductCard key={`${p.id}-${index}`} {...p} />
        ))}
      </div>
      <div
        ref={sentinelRef}
        className="h-10 flex items-center justify-center text-xs text-gray-500 mt-6"
      >
        {loading ? "Loading..." : hasMore ? "Loading more..." : "No more items"}
      </div>
    </main>
  );
}
