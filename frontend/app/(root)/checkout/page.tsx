"use client";

import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
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

interface Address {
  AddressID: number;
  ContactName: string;
  ContactPhoneNumber: string;
  City: string;
  District: string;
  Commune: string;
  DetailAddress: string;
  AddressType: string;
  IsAddressDefault: string;
}

const deliveryProviders = [
  { name: "VNPost", fee: 36363, method: "Standard" },
  { name: "GrabExpress", fee: 36363, method: "Express" },
  { name: "Giao Hang Nhanh", fee: 36363, method: "Economy" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const cartContext = useContext(CartContext);
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accountID, setAccountID] = useState("");
  const [providerName, setProviderName] = useState("VCB");
  const [deliveryProvider, setDeliveryProvider] = useState(
    deliveryProviders[0]
  );
  const [note, setNote] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressID, setSelectedAddressID] = useState<number | null>(
    null
  );

  useEffect(() => {
    const fetchCartAndSelectedItems = async () => {
      try {
        const [cartRes, addressRes] = await Promise.all([
          api.get(API_PATHS.BUYER.CART.GET),
          api.get(API_PATHS.BUYER.ADDRESSES),
        ]);

        const cart = cartRes.data;
        setAddresses(addressRes.data);
        setCartTotal(cart.TotalCost || 0);

        // Set default address if available
        const defaultAddr = addressRes.data.find(
          (a: Address) => a.IsAddressDefault === "Y"
        );
        if (defaultAddr) {
          setSelectedAddressID(defaultAddr.AddressID);
        } else if (addressRes.data.length > 0) {
          setSelectedAddressID(addressRes.data[0].AddressID);
        }

        // Use all items from cart
        const items = cart.StoredSKU || [];

        if (items.length === 0) {
          alert("Your cart is empty");
          router.push("/cart");
          return;
        }

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

  const calculateTotal = () => {
    return cartTotal + deliveryProvider.fee;
  };

  const handlePlaceOrder = async () => {
    if (!accountID.trim()) {
      alert("⚠️ Please enter your bank account number to proceed with payment.");
      return;
    }

    if (selectedItems.length === 0) {
      alert("⚠️ No items to checkout. Please add items to your cart first.");
      return;
    }

    if (!selectedAddressID) {
      alert("⚠️ Please select a delivery address to continue with your order.");
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
      await api.put(API_PATHS.BUYER.ORDER.CREATE, {
        Skus: skus,
        AddressID: selectedAddressID,
        ProviderName: providerName,
        AccountID: accountID,
        DeliveryMethodName: deliveryProvider.method,
        DeliveryProviderName: deliveryProvider.name,
      });

      // Update cart count
      if (cartContext) {
        await cartContext.fetchCartCount();
      }

      alert("✅️ Order placed successfully!\n\nYour order has been confirmed and is being processed.");
      router.push("/product");
    } catch (err: any) {
      console.error("Failed to place order:", err);
      const errorMsg = err.response?.data?.error || err.message || "Unknown error occurred";
      alert(`❌ Failed to place order: ${errorMsg}.\n\nPlease verify your information and try again.`);
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
        <h1 className="text-3xl font-bold mb-8 text-brand">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Section - Order Items & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Delivery Address</h2>
              {addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.AddressID}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedAddressID === addr.AddressID
                          ? "border-brand bg-brand/5"
                          : "border-gray-200 hover:border-brand/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressID === addr.AddressID}
                        onChange={() => setSelectedAddressID(addr.AddressID)}
                        className="mt-1 w-4 h-4 accent-brand"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{addr.ContactName}</span>
                          <span className="text-gray-500">|</span>
                          <span className="text-gray-600">
                            {addr.ContactPhoneNumber}
                          </span>
                          {addr.IsAddressDefault === "Y" && (
                            <span className="text-xs bg-brand text-white px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                            {addr.AddressType}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {addr.DetailAddress}, {addr.Commune}, {addr.District},{" "}
                          {addr.City}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No addresses found. Please add an address in your profile.
                </div>
              )}
            </div>

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
                        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-white">
                          <Image
                            src={imageUrl}
                            alt={item.SKU.ProductInfo.ProductName}
                            fill
                            className="object-contain"
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
                      <div className="col-span-2 text-center text-sm font-semibold">
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
                  <div className="relative">
                    <select
                      value={providerName}
                      onChange={(e) => setProviderName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand appearance-none pr-10"
                    >
                      <option value="VCB">VietcomBank</option>
                      <option value="MoMo">MoMo</option>
                      <option value="OCB">OCB</option>
                      <option value="ZaloPay">ZaloPay</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none w-5 h-5" />
                  </div>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
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
                  <span className="font-semibold">{formatVND(cartTotal)}</span>
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
