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
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const originalCart = useRef<any>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await api.get(API_PATHS.BUYER.CART.GET);
      setCart(res.data);
      originalCart.current = JSON.parse(JSON.stringify(res.data));
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
    const originalItem = originalCart.current?.StoredSKU.find(
      (item: any) => item.ProductID === ProductID && item.SKUName === SKUName
    );
    const originalQuantity = originalItem ? originalItem.Quantity : 0;
    const delta = Quantity - originalQuantity;
    try {
      await api.post(API_PATHS.BUYER.CART.GET, {
        ProductID,
        SKUName,
        Quantity: delta,
      });
      fetchCart();
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
      setCart((prevCart: any) => {
        const updatedStoredSKU = prevCart.StoredSKU.map((i: any) =>
          i.ProductID === item.ProductID && i.SKUName === item.SKUName
            ? { ...i, Quantity: newQuantity }
            : i
        );
        return {
          ...prevCart,
          StoredSKU: updatedStoredSKU,
        };
      });
      debouncedUpdateQuantity(item.ProductID, item.SKUName, newQuantity);
    }
  };

  const decrementQuantity = (item: any) => {
    if (item.Quantity > 1) {
      const newQuantity = item.Quantity - 1;
      setCart((prevCart: any) => {
        const updatedStoredSKU = prevCart.StoredSKU.map((i: any) =>
          i.ProductID === item.ProductID && i.SKUName === item.SKUName
            ? { ...i, Quantity: newQuantity }
            : i
        );
        return {
          ...prevCart,
          StoredSKU: updatedStoredSKU,
        };
      });
      debouncedUpdateQuantity(item.ProductID, item.SKUName, newQuantity);
    }
  };

  const handleQuantityChange = (item: any, newQuantity: number) => {
    setCart((prevCart: any) => {
      const updatedStoredSKU = prevCart.StoredSKU.map((i: any) =>
        i.ProductID === item.ProductID && i.SKUName === item.SKUName
          ? { ...i, Quantity: newQuantity }
          : i
      );
      return {
        ...prevCart,
        StoredSKU: updatedStoredSKU,
      };
    });
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
    } catch (err: any) {
      console.error("Failed to remove item:", err);
      const errorMsg = err.response?.data?.error || err.message || "Unknown error occurred";
      alert(`❌ Failed to remove item from cart: ${errorMsg}.\n\nPlease try again or refresh the page.`);
    }
  };

  const handleDeleteAll = async () => {
    if (!cart?.StoredSKU?.length) {
      alert("Cart is already empty!");
      return;
    }

    if (!confirm("Are you sure you want to delete all items from cart?")) {
      return;
    }

    try {
      const deletePromises = cart.StoredSKU.map((item: any) => {
        return api.delete(API_PATHS.BUYER.CART.GET, {
          data: { ProductID: item.ProductID, SKUName: item.SKUName },
        });
      });
      await Promise.all(deletePromises);

      // Update cart count in context
      if (cartContext) {
        cartContext.setCartCount(0);
      }

      fetchCart();
    } catch (err: any) {
      console.error("Failed to delete items:", err);
      const errorMsg = err.response?.data?.error || err.message || "Unknown error occurred";
      alert(`❌ Failed to clear cart: ${errorMsg}.\n\nSome items may not have been removed. Please refresh the page.`);
    }
  };

  const handleCheckout = () => {
    if (!cart?.StoredSKU?.length) {
      alert("⚠️ Your cart is empty. Please add items before checking out.");
      return;
    }
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
                  const itemTotal = item.SKU.Price * item.Quantity;
                  const maxStock = item.SKU.InStockNumber;

                  return (
                    <div
                      key={itemKey}
                      className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 shadow-sm"
                    >
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
              {/* Left side - Delete All */}
              <div className="flex items-center gap-6">
                <button
                  onClick={handleDeleteAll}
                  className="flex items-center gap-2 text-red-500 hover:text-red-700 font-medium"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete All
                </button>
              </div>

              {/* Right side - Total & Checkout */}
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Total ({cart.StoredSKU.length}{" "}
                    {cart.StoredSKU.length > 1 ? "products" : "product"}):
                  </p>
                  <p className="text-2xl font-bold text-brand">
                    {formatVND(cart.TotalCost)}
                  </p>
                </div>
                <button
                  onClick={handleCheckout}
                  className="bg-brand text-white px-12 py-3 rounded-full font-semibold hover:bg-opacity-90 transition"
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
