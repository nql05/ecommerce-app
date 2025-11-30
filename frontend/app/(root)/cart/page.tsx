"use client";

import { useEffect, useState, useContext, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { API_PATHS } from "../../../lib/apiPath";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import formatVND from "../../../utils/formatVND";
import Link from "next/link";
import { CartContext } from "../../../context/CartContext";
import QuantityCounter from "../../../components/QuantityCounter";

export default function Cart() {
  const router = useRouter();
  const cartContext = useContext(CartContext);
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

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

  const updateQuantityAPI = async (
    ProductID: number,
    SKUName: string,
    Quantity: number
  ) => {
    try {
      await api.post(API_PATHS.BUYER.CART.GET, {
        ProductID,
        SKUName,
        Quantity,
      });
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update quantity");
      fetchCart(); // Refresh cart on error
    }
  };

  const debouncedUpdateQuantity = (
    ProductID: number,
    SKUName: string,
    Quantity: number
  ) => {
    const key = `${ProductID}:::${SKUName}`;

    // Clear existing timer for this item
    if (debounceTimers.current.has(key)) {
      clearTimeout(debounceTimers.current.get(key)!);
    }

    // Set new timer
    const timer = setTimeout(() => {
      updateQuantityAPI(ProductID, SKUName, Quantity);
      debounceTimers.current.delete(key);
    }, 500); // 500ms debounce

    debounceTimers.current.set(key, timer);
  };

  const incrementQuantity = (item: any) => {
    const maxStock = item.SKU.InStockNumber;
    if (item.Quantity < maxStock) {
      const newQuantity = item.Quantity + 1;
      setCart((prevCart: any) => ({
        ...prevCart,
        StoredSKU: prevCart.StoredSKU.map((i: any) =>
          i.ProductID === item.ProductID && i.SKUName === item.SKUName
            ? { ...i, Quantity: newQuantity }
            : i
        ),
      }));
      debouncedUpdateQuantity(item.ProductID, item.SKUName, newQuantity);
    }
  };

  const decrementQuantity = (item: any) => {
    if (item.Quantity > 1) {
      const newQuantity = item.Quantity - 1;
      setCart((prevCart: any) => ({
        ...prevCart,
        StoredSKU: prevCart.StoredSKU.map((i: any) =>
          i.ProductID === item.ProductID && i.SKUName === item.SKUName
            ? { ...i, Quantity: newQuantity }
            : i
        ),
      }));
      debouncedUpdateQuantity(item.ProductID, item.SKUName, newQuantity);
    }
  };

  const handleQuantityChange = (item: any, newQuantity: number) => {
    setCart((prevCart: any) => ({
      ...prevCart,
      StoredSKU: prevCart.StoredSKU.map((i: any) =>
        i.ProductID === item.ProductID && i.SKUName === item.SKUName
          ? { ...i, Quantity: newQuantity }
          : i
      ),
    }));
    debouncedUpdateQuantity(item.ProductID, item.SKUName, newQuantity);
  };

  const removeItem = async (ProductID: number, SKUName: string) => {
    if (!confirm("Are you sure you want to delete this item from cart?")) {
      return;
    }

    try {
      await api.delete(API_PATHS.BUYER.CART.GET, {
        data: { ProductID, SKUName },
      });
      fetchCart();
      // Update cart count in context
      if (cartContext) {
        cartContext.setCartCount(Math.max(0, cartContext.cartCount - 1));
      }
      // Remove from selection
      const key = `${ProductID}:::${SKUName}`;
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

  const toggleSelectItem = (ProductID: number, SKUName: string) => {
    const key = `${ProductID}:::${SKUName}`; // Use ::: as separator
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
        (item: any) => `${item.ProductID}:::${item.SKUName}`
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
    } else if (selectedItems.size === 1) {
      if (!confirm("Are you sure you want to delete this item from cart?")) {
        return;
      }
    } else if (
      !confirm("Are you sure you want to delete these items from cart?")
    ) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedItems).map((key) => {
        const [ProductID, SKUName] = key.split(":::"); // Split by :::
        return api.delete(API_PATHS.BUYER.CART.GET, {
          data: { ProductID: parseInt(ProductID), SKUName },
        });
      });
      await Promise.all(deletePromises);

      // Update cart count in context
      const itemsDeletedCount = selectedItems.size;
      if (cartContext) {
        cartContext.setCartCount(
          Math.max(0, cartContext.cartCount - itemsDeletedCount)
        );
      }

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
      const key = `${item.ProductID}:::${item.SKUName}`;
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
    // Store selected items in sessionStorage for checkout page
    sessionStorage.setItem(
      "selectedCartItems",
      JSON.stringify(Array.from(selectedItems))
    );
    router.push("/checkout");
  };

  return (
    <main className="pt-32 pb-32">
      <h1 className="text-3xl font-bold mb-8 text-brand">Shopping Cart</h1>
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
            <div className="bg-white border border-gray-200 rounded-xl p-10 text-center flex flex-col items-center gap-4 shadow-sm">
              <p className="text-gray-600 text-lg">Your cart is empty.</p>

              <Link
                href="/product"
                className="px-6 py-2 bg-brand text-white rounded-lg font-semibold hover:bg-brand/90 transition inline-block"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <>
              {/* Header Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm">
                <div className="flex items-center gap-4">
                  {/* Checkbox placeholder */}
                  <div className="w-5"></div>
                  {/* Product name */}
                  <div className="flex-1 font-semibold text-gray-700">
                    Product
                  </div>
                  {/* Unit Price */}
                  <div className="text-center w-24 font-semibold text-gray-700">
                    Unit Price
                  </div>
                  {/* Quantity */}
                  <div className="text-center w-32 font-semibold text-gray-700">
                    Quantity
                  </div>
                  {/* Total */}
                  <div className="text-center w-28 font-semibold text-gray-700">
                    Total
                  </div>
                  {/* Delete button placeholder */}
                  <div className="w-9"></div>
                </div>
              </div>

              <div className="space-y-3">
                {cart.StoredSKU.map((item: any) => {
                  const imageUrl =
                    item.SKU?.SKUImage?.[0]?.SKU_URL ||
                    "https://via.placeholder.com/100?text=No+Image";
                  const itemKey = `${item.ProductID}:::${item.SKUName}`;
                  const isSelected = selectedItems.has(itemKey);
                  const itemTotal = item.SKU.Price * item.Quantity;
                  const maxStock = item.SKU.InStockNumber;

                  return (
                    <div
                      key={itemKey}
                      className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 shadow-sm"
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
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white">
                        <Image
                          src={imageUrl}
                          alt={item.SKU.ProductInfo?.ProductName}
                          fill
                          className="object-contain"
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
                        <p className="font-semibold">
                          {formatVND(item.SKU.Price)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-center w-32">
                        <QuantityCounter
                          quantity={item.Quantity}
                          maxStock={maxStock}
                          onIncrement={() => incrementQuantity(item)}
                          onDecrement={() => decrementQuantity(item)}
                          onChange={(value) =>
                            handleQuantityChange(item, value)
                          }
                          size="small"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {maxStock} {maxStock > 1 ? "items" : "item"} left
                        </p>
                      </div>

                      {/* Total Price */}
                      <div className="text-center w-28">
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
            </>
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
                    {selectedItems.size > 1 ? "products" : "product"}):
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
