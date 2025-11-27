"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../../lib/api";
import { API_PATHS } from "../../../lib/apiPath";
import { Edit, Trash2, Plus, BarChart2, X } from "lucide-react";
import formatVND from "../../../utils/formatVND";

export default function SellerDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState(0);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [currentStats, setCurrentStats] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (statsModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [statsModalOpen]);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const [productsRes, earningsRes] = await Promise.all([
          api.get(API_PATHS.SELLER.PRODUCTS.LIST),
          api.get(API_PATHS.SELLER.EARNINGS),
        ]);
        setProducts(productsRes.data);
        setEarnings(earningsRes.data.earnings);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(API_PATHS.SELLER.PRODUCTS.DELETE(id));
      setProducts(products.filter((p) => p.ProductID !== id));
      alert("Product deleted");
    } catch (err) {
      alert("Failed to delete product");
    }
  };

  const handleShowStats = async (product: any) => {
    setSelectedProduct(product);
    setStatsModalOpen(true);
    setCurrentStats(null);
    try {
      const res = await api.get(
        API_PATHS.SELLER.PRODUCTS.STATISTICS(product.ProductID)
      );
      setCurrentStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats");
    }
  };

  return (
    <main className="pt-32 pb-16 relative">
      <div className="w-full px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Seller Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Total Earnings:{" "}
              <span className="text-brand font-bold text-xl">
                {formatVND(earnings)}
              </span>
            </p>
          </div>
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
                <div className="flex items-center gap-6 flex-1">
                  <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                    <img
                      src={
                        product.SKU?.[0]?.SKUImage?.[0]?.SKU_URL ||
                        "/placeholder.png"
                      }
                      alt={product.ProductName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold">
                      {product.ProductName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {product.ProductDescription || "No description"}
                    </p>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>Category: {product.ProductCategory}</span>
                      <span>Brand: {product.ProductBrand || "N/A"}</span>
                      <span>SKUs: {product.SKU?.length || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 ml-4">
                  <button
                    onClick={() => handleShowStats(product)}
                    className="p-3 border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition"
                    title="Statistics"
                  >
                    <BarChart2 className="w-5 h-5" />
                  </button>
                  <button className="p-3 border-2 border-brand text-brand rounded-lg hover:bg-brand hover:text-white transition">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.ProductID)}
                    className="p-3 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics Modal */}
      {mounted &&
        statsModalOpen &&
        selectedProduct &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
            onClick={() => setStatsModalOpen(false)}
          >
            <div
              className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-xl font-bold">
                  Statistics: {selectedProduct.ProductName}
                </h2>
                <button
                  onClick={() => setStatsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {currentStats ? (
                  <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-semibold mb-1">
                          Total Sold
                        </p>
                        <p className="text-2xl font-bold text-blue-900">
                          {currentStats.totalSold} units
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-semibold mb-1">
                          Total Revenue
                        </p>
                        <p className="text-2xl font-bold text-green-900">
                          {formatVND(currentStats.totalRevenue)}
                        </p>
                      </div>
                    </div>

                    {/* Daily Stats */}
                    <div>
                      <h3 className="font-bold mb-4 text-lg">Daily Revenue</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {Object.entries(currentStats.dailyStats).length > 0 ? (
                          Object.entries(currentStats.dailyStats).map(
                            ([date, revenue]) => (
                              <div
                                key={date}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                              >
                                <span className="font-medium">{date}</span>
                                <span className="font-bold text-brand">
                                  {formatVND(revenue as number)}
                                </span>
                              </div>
                            )
                          )
                        ) : (
                          <p className="text-gray-500 text-center py-4">
                            No sales data yet
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Monthly Stats */}
                    <div>
                      <h3 className="font-bold mb-4 text-lg">
                        Monthly Revenue
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(currentStats.monthlyStats).length >
                        0 ? (
                          Object.entries(currentStats.monthlyStats).map(
                            ([month, revenue]) => (
                              <div
                                key={month}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                              >
                                <span className="font-medium">{month}</span>
                                <span className="font-bold text-brand">
                                  {formatVND(revenue as number)}
                                </span>
                              </div>
                            )
                          )
                        ) : (
                          <p className="text-gray-500 text-center py-4">
                            No sales data yet
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Yearly Stats */}
                    <div>
                      <h3 className="font-bold mb-4 text-lg">Yearly Revenue</h3>
                      <div className="space-y-2">
                        {Object.entries(currentStats.yearlyStats || {}).length >
                        0 ? (
                          Object.entries(currentStats.yearlyStats).map(
                            ([year, revenue]) => (
                              <div
                                key={year}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                              >
                                <span className="font-medium">{year}</span>
                                <span className="font-bold text-brand">
                                  {formatVND(revenue as number)}
                                </span>
                              </div>
                            )
                          )
                        ) : (
                          <p className="text-gray-500 text-center py-4">
                            No sales data yet
                          </p>
                        )}
                      </div>
                    </div>

                    {/* SKU Stats */}
                    <div>
                      <h3 className="font-bold mb-4 text-lg">Revenue by SKU</h3>
                      <div className="space-y-2">
                        {Object.entries(currentStats.skuStats || {}).length >
                        0 ? (
                          Object.entries(currentStats.skuStats).map(
                            ([sku, stats]: [string, any]) => (
                              <div
                                key={sku}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                              >
                                <span className="font-medium">{sku}</span>
                                <div className="text-right">
                                  <p className="font-bold text-brand">
                                    {formatVND(stats.revenue)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {stats.quantity} sold
                                  </p>
                                </div>
                              </div>
                            )
                          )
                        ) : (
                          <p className="text-gray-500 text-center py-4">
                            No sales data yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center py-12">
                    <p className="text-gray-500">Loading statistics...</p>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </main>
  );
}
