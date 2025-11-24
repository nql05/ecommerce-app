"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { API_PATHS } from "../../../lib/apiPath";
import Image from "next/image";
import { Trash2, Plus, Minus } from "lucide-react";
import formatVND from "../../../utils/formatVND";

export default function Cart() {
  const router = useRouter();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await api.get(API_PATHS.BUYER.CART.GET);
      setCart(res.data);
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError("You must be logged in as a buyer to view your cart.");
      } else if (err.response?.status === 404) {
        setError("Cart not found.");
      } else {
        setError("Failed to load cart.");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (
    productID: number,
    skuName: string,
    newQuantity: number,
    maxStock: number
  ) => {
    if (newQuantity < 1 || newQuantity > maxStock) return;
    try {
      await api.put(API_PATHS.BUYER.CART.GET, {
        productID,
        skuName,
        quantity: newQuantity,
      });
      fetchCart();
    } catch (err) {
      console.error("Failed to update quantity:", err);
      alert("Failed to update quantity");
    }
  };

  const removeItem = async (productID: number, skuName: string) => {
    try {
      await api.delete(API_PATHS.BUYER.CART.GET, {
        data: { productID, skuName },
      });
      fetchCart();
      // Remove from selection
      const key = `${productID}-${skuName}`;
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    } catch (err) {
      console.error("Failed to remove item:", err);
      alert("Failed to remove item");
    }
  };

  const toggleSelectItem = (productID: number, skuName: string) => {
    const key = `${productID}-${skuName}`;
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (!cart?.StoredSKU) return;
    if (selectedItems.size === cart.StoredSKU.length) {
      setSelectedItems(new Set());
    } else {
      const allKeys = cart.StoredSKU.map(
        (item: any) => `${item.ProductID}-${item.SKUName}`
      );
      setSelectedItems(new Set(allKeys));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) {
      alert("You have to choose product to delete!");
      return;
    }

    if (selectedItems.size === cart?.StoredSKU?.length) {
      if (!confirm("Are you sure you want to delete all items from cart?")) {
        return;
      }
    }

    try {
      const deletePromises = Array.from(selectedItems).map((key) => {
        const [productID, skuName] = key.split("-");
        return api.delete(API_PATHS.BUYER.CART.GET, {
          data: { productID: parseInt(productID), skuName },
        });
      });
      await Promise.all(deletePromises);
      setSelectedItems(new Set());
      fetchCart();
    } catch (err) {
      console.error("Failed to delete items:", err);
      alert("Failed to delete some items");
    }
  };

  const calculateSelectedTotal = () => {
    if (!cart?.StoredSKU) return 0;
    return cart.StoredSKU.reduce((sum: number, item: any) => {
      const key = `${item.ProductID}-${item.SKUName}`;
      if (selectedItems.has(key)) {
        return sum + item.SKU.Price * item.Quantity;
      }
      return sum;
    }, 0);
  };

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      alert("Please select items to checkout");
      return;
    }
    router.push("/checkout");
  };

  return (
    <main className="pt-32 pb-32">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading cart...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          {!cart || !cart.StoredSKU || cart.StoredSKU.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <p className="text-gray-500 text-lg">Your cart is empty.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.StoredSKU.map((item: any) => {
                const imageUrl =
                  item.SKU?.SKUImage?.[0]?.SKU_URL ||
                  "https://via.placeholder.com/100?text=No+Image";
                const itemKey = `${item.ProductID}-${item.SKUName}`;
                const isSelected = selectedItems.has(itemKey);
                const itemTotal = item.SKU.Price * item.Quantity;
                const maxStock = item.SKU.InStockNumber;

                return (
                  <div
                    key={itemKey}
                    className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4"
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        toggleSelectItem(item.ProductID, item.SKUName)
                      }
                      className="w-5 h-5 cursor-pointer accent-brand"
                    />

                    {/* Product Image */}
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={imageUrl}
                        alt={item.SKU.ProductInfo.ProductName}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base mb-1 truncate">
                        {item.SKU.ProductInfo.ProductName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.SKU.SKUName}
                      </p>
                    </div>

                    {/* Unit Price */}
                    <div className="text-center w-24">
                      <p className="text-sm text-gray-500">Unit Price</p>
                      <p className="font-semibold">
                        {formatVND(item.SKU.Price)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-center">
                      <p className="text-sm text-gray-500 mb-1">Quantity</p>
                      <div className="flex items-center border border-gray-300 rounded">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.ProductID,
                              item.SKUName,
                              item.Quantity - 1,
                              maxStock
                            )
                          }
                          disabled={item.Quantity <= 1}
                          className="px-2 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={item.Quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            updateQuantity(
                              item.ProductID,
                              item.SKUName,
                              val,
                              maxStock
                            );
                          }}
                          min={1}
                          max={maxStock}
                          className="w-12 text-center border-x border-gray-300 py-1 focus:outline-none"
                        />
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.ProductID,
                              item.SKUName,
                              item.Quantity + 1,
                              maxStock
                            )
                          }
                          disabled={item.Quantity >= maxStock}
                          className="px-2 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Max: {maxStock}
                      </p>
                    </div>

                    {/* Total Price */}
                    <div className="text-center w-28">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-bold text-brand">
                        {formatVND(itemTotal)}
                      </p>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => removeItem(item.ProductID, item.SKUName)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                      aria-label="Delete item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Fixed Footer */}
      {cart?.StoredSKU?.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Left side - Select All & Delete */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.size === cart.StoredSKU.length &&
                      cart.StoredSKU.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-5 h-5 accent-brand cursor-pointer"
                  />
                  <span className="font-medium">
                    Select All ({cart.StoredSKU.length})
                  </span>
                </label>
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-2 text-red-500 hover:text-red-700 font-medium"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
              </div>

              {/* Right side - Total & Checkout */}
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Total ({selectedItems.size}{" "}
                    {selectedItems.size === 1 ? "product" : "products"}):
                  </p>
                  <p className="text-2xl font-bold text-brand">
                    {formatVND(calculateSelectedTotal())}
                  </p>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={selectedItems.size === 0}
                  className="bg-brand text-white px-12 py-3 rounded-full font-semibold hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
