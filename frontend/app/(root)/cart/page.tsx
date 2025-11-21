"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/products/cart")
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
  }, []);

  const updateQuantity = (productID, skuName, quantity) => {
    api.put("/products/cart", { productID, skuName, quantity });
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: "rgb(9,10,21)" }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
        {loading ? (
          <div className="text-gray-300">Loading...</div>
        ) : (
          <>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {!cart || !cart.StoredSKU || cart.StoredSKU.length === 0 ? (
              <div className="card p-6 text-center text-gray-300">
                Your cart is empty.
              </div>
            ) : (
              <div className="space-y-4">
                {cart.StoredSKU.map((item) => (
                  <div
                    key={`${item.ProductID}-${item.SKUName}`}
                    className="card flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded bg-[rgba(255,255,255,0.03)] flex items-center justify-center text-gray-300">
                        Img
                      </div>
                      <div>
                        <div className="font-semibold">
                          {item.SKU.ProductInfo.ProductName}
                        </div>
                        <div className="text-sm text-gray-400">
                          {item.SKU.SKUName}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={item.Quantity}
                        min={1}
                        onChange={(e) =>
                          updateQuantity(
                            item.ProductID,
                            item.SKUName,
                            parseInt(e.target.value)
                          )
                        }
                        className="w-20 p-2 rounded bg-[rgba(255,255,255,0.02)] text-white border border-[rgba(255,255,255,0.06)]"
                      />
                      <button className="btn-primary">Update</button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <button className="btn-primary">Proceed to Checkout</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
