"use client";

import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { API_PATHS } from "../../../lib/apiPath";
import Image from "next/image";
import formatVND from "../../../utils/formatVND";
import { CartContext } from "../../../context/CartContext";

interface CartItem {
  ProductID: number;
  SKUName: string;
  Quantity: number;
  SKU: {
    Price: number;
    InStockNumber: number;
    ProductInfo: {
      ProductName: string;
    };
    SKUImage: Array<{ SKU_URL: string }>;
  };
}

const deliveryProviders = [
  { name: "VNPost", fee: 32700 },
  { name: "GHN", fee: 35000 },
  { name: "J&T Express", fee: 30000 },
  { name: "Viettel Post", fee: 33000 },
];

export default function CheckoutPage() {
  const router = useRouter();
  const cartContext = useContext(CartContext);
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountID, setAccountID] = useState("");
  const [providerName, setProviderName] = useState("Techcombank");
  const [deliveryProvider, setDeliveryProvider] = useState(
    deliveryProviders[0]
  );
  const [note, setNote] = useState("");

  useEffect(() => {
    const fetchCartAndSelectedItems = async () => {
      try {
        const res = await api.get(API_PATHS.BUYER.CART.GET);
        const cart = res.data;

        // Get selected items from sessionStorage (passed from cart page)
        const selectedKeys = JSON.parse(
          sessionStorage.getItem("selectedCartItems") || "[]"
        );

        if (selectedKeys.length === 0) {
          alert("No items selected for checkout");
          router.push("/cart");
          return;
        }

        // Filter cart items based on selected keys
        const items =
          cart.StoredSKU?.filter((item: CartItem) => {
            const key = `${item.ProductID}:::${item.SKUName}`;
            return selectedKeys.includes(key);
          }) || [];

        setSelectedItems(items);
      } catch (err) {
        console.error("Failed to fetch cart:", err);
        alert("Failed to load checkout data");
        router.push("/cart");
      } finally {
        setLoading(false);
      }
    };

    fetchCartAndSelectedItems();
  }, [router]);

  const calculateSubtotal = () => {
    return selectedItems.reduce(
      (sum, item) => sum + item.SKU.Price * item.Quantity,
      0
    );
  };

  const calculateTotal = () => {
    return calculateSubtotal() + deliveryProvider.fee;
  };

  const handlePlaceOrder = async () => {
    if (!accountID.trim()) {
      alert("Please enter your bank account number");
      return;
    }

    if (selectedItems.length === 0) {
      alert("No items to checkout");
      return;
    }

    try {
      setLoading(true);

      // Prepare SKUs for order creation
      const skus = selectedItems.map((item) => ({
        ProductID: item.ProductID,
        SKUName: item.SKUName,
        Quantity: item.Quantity,
      }));

      // Create order
      await api.post(API_PATHS.BUYER.ORDER.CREATE, {
        Skus: skus,
        AddressID: 1, // Default address - in production, let user select
        ProviderName: providerName,
        AccountID: accountID,
      });

      // Remove purchased items from cart
      const deletePromises = selectedItems.map((item) =>
        api.delete(API_PATHS.BUYER.CART.GET, {
          data: { ProductID: item.ProductID, SKUName: item.SKUName },
        })
      );
      await Promise.all(deletePromises);

      // Update cart count
      if (cartContext) {
        await cartContext.fetchCartCount();
      }

      // Clear session storage
      sessionStorage.removeItem("selectedCartItems");

      alert("Order placed successfully!");
      router.push("/product");
    } catch (err: any) {
      console.error("Failed to place order:", err);
      alert(err.response?.data?.error || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="pt-32 pb-16">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading checkout...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-32 pb-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Section - Order Items & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product List */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Order Items</h2>

              {/* Header */}
              <div className="grid grid-cols-12 gap-4 pb-3 mb-3 border-b border-gray-200 text-sm font-semibold text-gray-600">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Unit Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-center">Total</div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                {selectedItems.map((item) => {
                  const imageUrl =
                    item.SKU?.SKUImage?.[0]?.SKU_URL ||
                    "https://via.placeholder.com/80?text=No+Image";
                  const itemTotal = item.SKU.Price * item.Quantity;

                  return (
                    <div
                      key={`${item.ProductID}:::${item.SKUName}`}
                      className="grid grid-cols-12 gap-4 items-center"
                    >
                      {/* Product Info */}
                      <div className="col-span-6 flex gap-3">
                        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={imageUrl}
                            alt={item.SKU.ProductInfo.ProductName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                            {item.SKU.ProductInfo.ProductName}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {item.SKUName}
                          </p>
                        </div>
                      </div>

                      {/* Unit Price */}
                      <div className="col-span-2 text-center text-sm">
                        {formatVND(item.SKU.Price)}
                      </div>

                      {/* Quantity */}
                      <div className="col-span-2 text-center text-sm font-semibold">
                        {item.Quantity}
                      </div>

                      {/* Total */}
                      <div className="col-span-2 text-center font-bold text-brand">
                        {formatVND(itemTotal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Payment Method</h2>

              <div className="space-y-4">
                {/* Bank Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Select Bank
                  </label>
                  <select
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-brand"
                  >
                    <option value="Techcombank">Techcombank - 52519</option>
                    <option value="VCB">VietcomBank</option>
                    <option value="ACB">ACB</option>
                    <option value="MBBank">MB Bank</option>
                    <option value="BIDV">BIDV</option>
                  </select>
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={accountID}
                    onChange={(e) => setAccountID(e.target.value)}
                    placeholder="Enter your account number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-brand"
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Note to Seller (Optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Leave a message..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-brand resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Method */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Delivery Method</h2>

              <div className="space-y-3">
                {deliveryProviders.map((provider) => (
                  <label
                    key={provider.name}
                    className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition ${
                      deliveryProvider.name === provider.name
                        ? "border-brand bg-brand/5"
                        : "border-gray-200 hover:border-brand/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliveryProvider.name === provider.name}
                        onChange={() => setDeliveryProvider(provider)}
                        className="w-4 h-4 accent-brand"
                      />
                      <div>
                        <p className="font-semibold">{provider.name}</p>
                        <p className="text-xs text-gray-500">
                          Estimated delivery: 2-3 days
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-brand">
                      {formatVND(provider.fee)}
                    </p>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Section - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm sticky top-32">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Subtotal ({selectedItems.length}{" "}
                    {selectedItems.length > 1 ? "items" : "item"}):
                  </span>
                  <span className="font-semibold">
                    {formatVND(calculateSubtotal())}
                  </span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping Fee:</span>
                  <span className="font-semibold">
                    {formatVND(deliveryProvider.fee)}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-2xl font-bold text-brand">
                      {formatVND(calculateTotal())}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading || !accountID.trim()}
                className="w-full mt-6 bg-brand text-white py-3 rounded-full font-semibold hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Place Order"}
              </button>

              <button
                onClick={() => router.push("/cart")}
                className="w-full mt-3 border-2 border-gray-300 text-gray-700 py-3 rounded-full font-semibold hover:border-brand hover:text-brand transition"
              >
                Back to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
