"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { API_PATHS } from "../../../lib/apiPath";
import { Edit, Trash2, Plus } from "lucide-react";

export default function SellerDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(API_PATHS.SELLER.PRODUCTS.LIST)
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Failed to fetch products:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="pt-32 pb-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Seller Dashboard</h1>
        <button className="flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition">
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">No products yet.</p>
          <button className="bg-brand text-white px-6 py-2 rounded-full font-semibold hover:bg-opacity-90 transition">
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {products.map((product) => (
            <div
              key={product.ProductID}
              className="bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-between hover:shadow-md transition"
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">
                  {product.ProductName}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {product.ProductDescription || "No description"}
                </p>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>Category: {product.ProductCategory}</span>
                  <span>Brand: {product.ProductBrand || "N/A"}</span>
                  <span>SKUs: {product.SKU?.length || 0}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="p-3 border-2 border-brand text-brand rounded-lg hover:bg-brand hover:text-white transition">
                  <Edit className="w-5 h-5" />
                </button>
                <button className="p-3 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
