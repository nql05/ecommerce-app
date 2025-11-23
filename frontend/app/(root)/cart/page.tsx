"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { API_PATHS } from "../../../lib/apiPath";
import Image from "next/image";
import { Trash2, Plus, Minus } from "lucide-react";
import formatVND from "../../../utils/formatVND";

export default function Cart() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = () => {
    api
      .get(API_PATHS.BUYER.CART.GET)
      .then((res) => setCart(res.data))
      .catch((err) => {
        if (err.response && err.response.status === 400) {
          setError("You must be logged in as a buyer to view your cart.");
        } else if (err.response && err.response.status === 404) {
          setError("Cart not found.");
        } else {
          setError("Failed to load cart.");
        }
      })
      .finally(() => setLoading(false));
  };

  const updateQuantity = async (productID: number, skuName: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await api.put(API_PATHS.BUYER.CART.GET, { productID, skuName, quantity: newQuantity });
      fetchCart();
    } catch (err) {
      console.error("Failed to update quantity:", err);
    }
  };

  const removeItem = async (productID: number, skuName: string) => {
    try {
      await api.delete(API_PATHS.BUYER.CART.GET, { data: { productID, skuName } });
      fetchCart();
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  const calculateTotal = () => {
    if (!cart?.StoredSKU) return 0;
    return cart.StoredSKU.reduce((sum: number, item: any) => 
      sum + (item.SKU.Price * item.Quantity), 0
    );
  };

  return (
    <main className="pt-32 pb-16">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cart.StoredSKU.map((item: any) => {
                  const imageUrl = item.SKU?.SKUImage?.[0]?.SKU_URL || "https://via.placeholder.com/100?text=No+Image";
                  return (
                    <div
                      key={`${item.ProductID}-${item.SKUName}`}
                      className="bg-white border border-gray-200 rounded-lg p-6 flex gap-6"
                    >
                      {/* Product Image */}
                      <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={imageUrl}
                          alt={item.SKU.ProductInfo.ProductName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {item.SKU.ProductInfo.ProductName}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          SKU: {item.SKU.SKUName}
                        </p>
                        <p className="text-brand font-semibold">
                          {formatVND(item.SKU.Price)}
                        </p>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex flex-col items-end gap-4">
                        <button
                          onClick={() => removeItem(item.ProductID, item.SKUName)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="flex items-center border-2 border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.ProductID, item.SKUName, item.Quantity - 1)}
                            className="p-2 hover:bg-gray-100"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 font-semibold">{item.Quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.ProductID, item.SKUName, item.Quantity + 1)}
                            className="p-2 hover:bg-gray-100"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
                  <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">{formatVND(calculateTotal())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-sm text-gray-500">Calculated at checkout</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-lg">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-brand">{formatVND(calculateTotal())}</span>
                    </div>
                  </div>
                  <button className="w-full bg-brand text-white py-3 rounded-full font-semibold hover:bg-opacity-90 transition">
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
