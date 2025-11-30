"use client";

import React, { useEffect, useRef, useState } from "react";
import ProductCard, { ProductCardProps } from "../../../components/ProductCard";
import api from "../../../lib/api";
import { API_PATHS } from "../../../lib/apiPath";
import { ChevronDown } from "lucide-react";

export default function ProductList() {
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [sortBy, setSortBy] = useState<"" | "price_asc" | "price_desc">("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchBrands = async () => {
    try {
      const response = await api.get(API_PATHS.BUYER.BRANDS);
      setBrands(response.data);
    } catch (error) {
      console.error("Failed to fetch brands:", error);
    }
  };

  const fetchProducts = async (brand?: string, sort?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (brand) params.append("brand", brand);
      if (sort) params.append("sortBy", sort);

      const response = await api.get(
        `${API_PATHS.BUYER.PRODUCTS.LIST}${
          params.toString() ? `?${params.toString()}` : ""
        }`
      );
      const fetchedProducts = response.data;

      // Transform database products to ProductCardProps format
      const transformedProducts: ProductCardProps[] = fetchedProducts.map(
        (product: any) => {
          const skus = product.SKU || [];
          // Find SKU with lowest price
          const lowestPriceSku = skus.reduce(
            (min: any, curr: any) => (curr.Price < min.Price ? curr : min),
            skus[0] || {}
          );

          const imageUrl =
            lowestPriceSku?.SKUImage?.[0]?.SKU_URL || "/images/placeholder.png";

          const price = lowestPriceSku?.Price || 0;

          return {
            id: product.ProductID,
            imageUrl,
            name: product.ProductName,
            price,
          };
        }
      );

      setProducts(transformedProducts);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    fetchProducts(selectedBrand, sortBy);
  }, [selectedBrand, sortBy]);

  return (
    <main className="pt-32 pb-16">
      {/* offset for fixed header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand">Latest Products</h1>
      </div>

      {/* Filter and Sort Controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="brand" className="text-sm font-medium text-gray-700">
            Brand:
          </label>
          <div className="relative">
            <select
              id="brand"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="appearance-none px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-white"
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            {/* @ts-ignore */}
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm font-medium text-gray-700">
            Sort by Price:
          </label>
          <div className="relative">
            <select
              id="sort"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "" | "price_asc" | "price_desc")
              }
              className="appearance-none px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-white"
            >
              <option value="">Default</option>
              <option value="price_asc">Low to High</option>
              <option value="price_desc">High to Low</option>
            </select>
            {/* @ts-ignore */}
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((p, index) => (
          <ProductCard key={`${p.id}-${index}`} {...p} />
        ))}
      </div>
      {loading && (
        <div className="h-10 flex items-center justify-center text-sm text-gray-500 mt-6">
          Loading...
        </div>
      )}
    </main>
  );
}
