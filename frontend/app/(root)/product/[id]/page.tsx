"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "../../../../lib/api";

export default function ProductDetails() {
  const params = useParams();
  const id = params.id;
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (id) {
      api.get(`/products/${id}`).then((res) => setProduct(res.data));
    }
  }, [id]);

  const addToCart = (sku) => {
    api.post("/products/cart", {
      productID: sku.ProductID,
      skuName: sku.SKUName,
      quantity: 1,
    });
  };

  if (!product) return <div className="p-6 text-gray-300">Loading...</div>;

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: "rgb(9,10,21)" }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="card p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 bg-[rgba(255,255,255,0.03)] h-48 rounded flex items-center justify-center text-gray-300">
              Image
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{product.ProductName}</h1>
              <p className="text-gray-300 mb-4">{product.ProductDescription}</p>
              <div className="mb-4">
                <h2 className="font-semibold mb-2">SKUs</h2>
                <div className="space-y-2">
                  {product.SKU.map((sku: any) => (
                    <div
                      key={sku.SKUName}
                      className="flex items-center justify-between bg-[rgba(255,255,255,0.02)] p-3 rounded"
                    >
                      <div>
                        <div className="font-semibold">{sku.SKUName}</div>
                        <div className="text-sm text-gray-400">
                          ${sku.Price}
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart(sku)}
                        className="btn-primary"
                      >
                        Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="font-semibold mb-2">Comments</h2>
                <div className="space-y-2">
                  {product.Comment.map((comment: any) => (
                    <div
                      key={comment.CommentID}
                      className="bg-[rgba(255,255,255,0.02)] p-3 rounded"
                    >
                      <p className="text-gray-300">{comment.Content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
