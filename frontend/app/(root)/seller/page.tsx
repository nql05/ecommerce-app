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

  // Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [skuSelectionModalOpen, setSkuSelectionModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedSkuToEdit, setSelectedSkuToEdit] = useState<any>(null);
  const [formData, setFormData] = useState({
    ProductName: "",
    ProductBrand: "",
    ProductCategory: "",
    ProductDescription: "",
    ProductMadeIn: "",
    skus: [
      {
        SKUName: "",
        Price: "",
        InStockNumber: "",
        Size: "",
        Weight: "",
      },
    ],
  });

  useEffect(() => {
    if (statsModalOpen || productModalOpen || skuSelectionModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [statsModalOpen, productModalOpen, skuSelectionModalOpen]);

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

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      ProductName: "",
      ProductBrand: "",
      ProductCategory: "",
      ProductDescription: "",
      ProductMadeIn: "",
      skus: [
        {
          SKUName: "",
          Price: "",
          InStockNumber: "",
          Size: "",
          Weight: "",
        },
      ],
    });
    setProductModalOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setSkuSelectionModalOpen(true);
  };

  const handleSelectSkuToEdit = (sku: any) => {
    setSelectedSkuToEdit(sku);
    setFormData({
      ProductName: editingProduct.ProductName,
      ProductBrand: editingProduct.ProductBrand || "",
      ProductCategory: editingProduct.ProductCategory,
      ProductDescription: editingProduct.ProductDescription || "",
      ProductMadeIn: editingProduct.ProductMadeIn,
      skus: [
        {
          SKUName: sku.SKUName,
          Price: String(sku.Price),
          InStockNumber: String(sku.InStockNumber),
          Size: String(sku.Size),
          Weight: String(sku.Weight),
        },
      ],
    });
    setSkuSelectionModalOpen(false);
    setProductModalOpen(true);
  };

  const handleAddSku = () => {
    setSelectedSkuToEdit(null);
    setFormData({
      ProductName: editingProduct.ProductName,
      ProductBrand: editingProduct.ProductBrand || "",
      ProductCategory: editingProduct.ProductCategory,
      ProductDescription: editingProduct.ProductDescription || "",
      ProductMadeIn: editingProduct.ProductMadeIn,
      skus: [
        {
          SKUName: "",
          Price: "",
          InStockNumber: "",
          Size: "",
          Weight: "",
        },
      ],
    });
    setSkuSelectionModalOpen(false);
    setProductModalOpen(true);
  };

  const handleDeleteSku = async (sku: any) => {
    if (!confirm(`Are you sure you want to delete SKU "${sku.SKUName}"?`))
      return;
    try {
      await api.delete(
        API_PATHS.SELLER.PRODUCTS.DELETE_SKU(
          editingProduct.ProductID,
          sku.SKUName
        )
      );

      // Update local state
      const updatedSkus = editingProduct.SKU.filter(
        (s: any) => s.SKUName !== sku.SKUName
      );
      const updatedProduct = { ...editingProduct, SKU: updatedSkus };

      setEditingProduct(updatedProduct);
      setProducts(
        products.map((p) =>
          p.ProductID === editingProduct.ProductID ? updatedProduct : p
        )
      );

      alert("SKU deleted");
    } catch (err) {
      console.error(err);
      alert("Failed to delete variant");
    }
  };

  const handleAddSkuRow = () => {
    setFormData({
      ...formData,
      skus: [
        ...formData.skus,
        {
          SKUName: "",
          Price: "",
          InStockNumber: "",
          Size: "",
          Weight: "",
        },
      ],
    });
  };

  const handleRemoveSkuRow = (index: number) => {
    const newSkus = [...formData.skus];
    newSkus.splice(index, 1);
    setFormData({ ...formData, skus: newSkus });
  };

  const handleSkuChange = (index: number, field: string, value: string) => {
    const newSkus = [...formData.skus];
    newSkus[index] = { ...newSkus[index], [field]: value };
    setFormData({ ...formData, skus: newSkus });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        // Edit Product Info
        const productPayload = {
          ProductName: formData.ProductName,
          ProductBrand: formData.ProductBrand,
          ProductCategory: formData.ProductCategory,
          ProductDescription: formData.ProductDescription,
          ProductMadeIn: formData.ProductMadeIn,
        };
        await api.put(
          API_PATHS.SELLER.PRODUCTS.EDIT(editingProduct.ProductID),
          productPayload
        );

        if (selectedSkuToEdit) {
          const skuData = formData.skus[0];
          const skuPayload = {
            SKU: {
              update: {
                where: {
                  ProductID_SKUName: {
                    ProductID: editingProduct.ProductID,
                    SKUName: selectedSkuToEdit.SKUName,
                  },
                },
                data: {
                  SKUName: skuData.SKUName,
                  Price: Number(skuData.Price),
                  InStockNumber: Number(skuData.InStockNumber),
                  Size: Number(skuData.Size),
                  Weight: Number(skuData.Weight),
                },
              },
            },
          };
          await api.put(
            API_PATHS.SELLER.PRODUCTS.EDIT(editingProduct.ProductID),
            skuPayload
          );
        } else {
          // Adding new SKU to existing product
          const skuPayload = {
            SKU: {
              create: formData.skus.map((sku) => ({
                SKUName: sku.SKUName,
                Price: Number(sku.Price),
                InStockNumber: Number(sku.InStockNumber),
                Size: Number(sku.Size),
                Weight: Number(sku.Weight),
                SKUImage: { create: [] },
              })),
            },
          };
          await api.put(
            API_PATHS.SELLER.PRODUCTS.EDIT(editingProduct.ProductID),
            skuPayload
          );
        }

        // Refresh list to get full structure including SKU
        const listRes = await api.get(API_PATHS.SELLER.PRODUCTS.LIST);
        setProducts(listRes.data);
        alert("Product updated");
      } else {
        // Add
        const payload = {
          ProductName: formData.ProductName,
          ProductBrand: formData.ProductBrand,
          ProductCategory: formData.ProductCategory,
          ProductDescription: formData.ProductDescription,
          ProductMadeIn: formData.ProductMadeIn,
          SKU: {
            create: formData.skus.map((sku) => ({
              SKUName: sku.SKUName,
              Price: Number(sku.Price),
              InStockNumber: Number(sku.InStockNumber),
              Size: Number(sku.Size),
              Weight: Number(sku.Weight),
              SKUImage: { create: [] },
            })),
          },
        };
        await api.post(API_PATHS.SELLER.PRODUCTS.ADD, payload);
        // Refresh list to get full structure including SKU
        const listRes = await api.get(API_PATHS.SELLER.PRODUCTS.LIST);
        setProducts(listRes.data);
        alert("Product added");
      }
      setProductModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save product");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setStatsModalOpen(false);
        setProductModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition"
          >
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
            <button
              onClick={handleOpenAdd}
              className="bg-brand text-white px-6 py-2 rounded-full font-semibold hover:bg-opacity-90 transition"
            >
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
                  <button
                    onClick={() => handleOpenEdit(product)}
                    className="p-3 border-2 border-brand text-brand rounded-lg hover:bg-brand hover:text-white transition"
                  >
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
              <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
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
                                className="flex justify-between items-center p-3 border rounded-lg"
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
                                className="flex justify-between items-center p-3 border rounded-lg"
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
                                className="flex justify-between items-center p-3 border rounded-lg"
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
                                className="flex justify-between items-center p-3 border rounded-lg"
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

      {/* SKU Selection Modal */}
      {mounted &&
        skuSelectionModalOpen &&
        editingProduct &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
            onClick={() => setSkuSelectionModalOpen(false)}
          >
            <div
              className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold">Select SKU to Edit</h2>
                <button
                  onClick={() => setSkuSelectionModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-600">
                  Choose which SKU of{" "}
                  <strong>{editingProduct.ProductName}</strong> you want to
                  edit.
                </p>
                <div className="space-y-2">
                  {editingProduct.SKU?.map((sku: any) => (
                    <div
                      key={sku.SKUName}
                      className="w-full p-4 border rounded-lg hover:bg-brand/5 hover:border-brand hover:ring-1 hover:ring-brand transition flex justify-between items-center group"
                    >
                      <button
                        onClick={() => handleSelectSkuToEdit(sku)}
                        className="flex-1 text-left"
                      >
                        <p className="font-semibold">{sku.SKUName}</p>
                        <p className="text-sm text-gray-500">
                          {formatVND(sku.Price)} - Stock: {sku.InStockNumber}
                        </p>
                      </button>
                      <button
                        onClick={() => handleDeleteSku(sku)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddSku}
                  className="flex items-center gap-2 text-brand font-semibold hover:underline"
                >
                  <Plus className="w-5 h-5" />
                  Add New SKU
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Product Modal */}
      {mounted &&
        productModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
            onClick={() => setProductModalOpen(false)}
          >
            <div
              className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold">
                  {editingProduct
                    ? selectedSkuToEdit
                      ? "Edit Product Variant"
                      : "Add New Variant"
                    : "Add New Product"}
                </h2>
                <button
                  onClick={() => setProductModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name
                    </label>
                    <input
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                      value={formData.ProductName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ProductName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <input
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                      value={formData.ProductBrand}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ProductBrand: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                      value={formData.ProductCategory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ProductCategory: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Made In
                    </label>
                    <input
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                      value={formData.ProductMadeIn}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ProductMadeIn: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    rows={3}
                    value={formData.ProductDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ProductDescription: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-3">
                    {editingProduct
                      ? selectedSkuToEdit
                        ? "SKU Details"
                        : "New SKU Details"
                      : "Product SKUs"}
                  </h3>

                  <div className="space-y-6">
                    {formData.skus.map((sku, index) => (
                      <div
                        key={index}
                        className="border p-4 rounded-lg relative shadow-sm"
                      >
                        {!editingProduct && formData.skus.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSkuRow(index)}
                            className="absolute top-2 right-2  hover:bg-gray-100 p-1 rounded-full"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}

                        {/* Allow removing rows when adding new variants to existing product, but keep at least one */}
                        {editingProduct &&
                          !selectedSkuToEdit &&
                          formData.skus.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSkuRow(index)}
                              className="absolute top-2 right-2  hover:bg-gray-100 p-1 rounded-full"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              SKU Name
                            </label>
                            <input
                              required
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                              value={sku.SKUName}
                              onChange={(e) =>
                                handleSkuChange(
                                  index,
                                  "SKUName",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Price
                            </label>
                            <input
                              required
                              type="number"
                              min="1000"
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                              value={sku.Price}
                              onChange={(e) =>
                                handleSkuChange(index, "Price", e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Stock
                            </label>
                            <input
                              required
                              type="number"
                              min="1"
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                              value={sku.InStockNumber}
                              onChange={(e) =>
                                handleSkuChange(
                                  index,
                                  "InStockNumber",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Size
                            </label>
                            <input
                              type="number"
                              min="0"
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                              value={sku.Size}
                              onChange={(e) =>
                                handleSkuChange(index, "Size", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Weight
                            </label>
                            <input
                              type="number"
                              min="0"
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                              value={sku.Weight}
                              onChange={(e) =>
                                handleSkuChange(index, "Weight", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!editingProduct && (
                    <button
                      type="button"
                      onClick={handleAddSkuRow}
                      className="mt-4 flex items-center gap-2 text-brand font-semibold hover:underline"
                    >
                      <Plus className="w-4 h-4" />
                      Add Another SKU
                    </button>
                  )}

                  {/* Allow adding multiple rows when adding new variants to existing product */}
                  {editingProduct && !selectedSkuToEdit && (
                    <button
                      type="button"
                      onClick={handleAddSkuRow}
                      className="mt-4 flex items-center gap-2 text-brand font-semibold hover:underline"
                    >
                      <Plus className="w-4 h-4" />
                      Add Another SKU
                    </button>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setProductModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-brand text-white rounded-lg hover:opacity-90 transition"
                  >
                    {editingProduct ? "Save Changes" : "Create Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </main>
  );
}
