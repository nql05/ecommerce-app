"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Minus, Plus, User } from "lucide-react";
import api from "../../../../lib/api";
import { API_PATHS } from "../../../../lib/apiPath";
import formatVND from "../../../../utils/formatVND";

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSku, setSelectedSku] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          API_PATHS.BUYER.PRODUCTS.DETAIL(params.id)
        );
        const productData = response.data;
        setProduct(productData);

        // Set first SKU as selected by default
        if (productData?.SKU?.length > 0) {
          setSelectedSku(productData.SKU[0].SKUName);
        }

        // Extract comments from SKUs
        const allComments =
          productData?.SKU?.flatMap(
            (sku: any) =>
              sku.Comment?.map((comment: any) => ({
                id: comment.CommentID,
                username: comment.LoginName,
                comment: comment.Content || "No comment text",
                rating: comment.Ratings,
                timestamp: new Date(comment.CommentID).toLocaleDateString(), // Using ID as proxy for date
              })) || []
          ) || [];
        setComments(allComments);
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [params.id]);

  const handleAddToCart = () => {
    alert(`Added ${quantity} item(s) to cart!`);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      alert(`Comment submitted: ${newComment}`);
      setNewComment("");
    }
  };

  const incrementQty = () => {
    const currentSku = product?.SKU?.find(
      (s: any) => s.SKUName === selectedSku
    );
    const maxStock = currentSku?.InStockNumber || 0;
    if (quantity < maxStock) setQuantity(quantity + 1);
  };

  const decrementQty = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  if (loading) {
    return (
      <main className="pt-24 pb-16">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading product details...</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="pt-24 pb-16">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Product not found</p>
        </div>
      </main>
    );
  }

  const currentSku =
    product.SKU?.find((s: any) => s.SKUName === selectedSku) ||
    product.SKU?.[0];
  const imageUrl =
    currentSku?.SKUImage?.[0]?.SKU_URL ||
    "https://via.placeholder.com/600?text=No+Image";
  const price = currentSku?.Price || 0;
  const stock = currentSku?.InStockNumber || 0;

  return (
    <main className="pt-32 pb-16">
      {/* Product Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Image */}
        <div className="w-full aspect-square relative rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={product.ProductName}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>

        {/* Product Details */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold mb-4">{product.ProductName}</h1>

          {/* Price */}
          <div className="text-3xl font-bold text-brand mb-6">
            {formatVND(price)}
          </div>

          {/* SKU Selection */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Select SKU</h3>
            <div className="flex gap-3 flex-wrap">
              {product.SKU?.map((sku: any) => (
                <button
                  key={sku.SKUName}
                  onClick={() => setSelectedSku(sku.SKUName)}
                  disabled={sku.InStockNumber === 0}
                  className={`px-4 py-2 rounded-full border-2 transition ${
                    selectedSku === sku.SKUName
                      ? "border-brand bg-brand text-white"
                      : sku.InStockNumber > 0
                      ? "border-gray-300 hover:border-brand"
                      : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {sku.SKUName} {sku.Size ? `- Size ${sku.Size}` : ""}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Counter */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center border-2 border-gray-300 rounded-full">
                <button
                  onClick={decrementQty}
                  className="p-3 hover:bg-gray-100 transition rounded-l-full"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-6 font-semibold">{quantity}</span>
                <button
                  onClick={incrementQty}
                  className="p-3 hover:bg-gray-100 transition rounded-r-full"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm">
                <span className="text-orange-500 font-semibold">
                  Only {stock} Items Left!
                </span>
                <br />
                <span className="text-gray-600">Don't miss it</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleAddToCart}
              className="px-20 py-3 border-2 border-brand text-brand rounded-full font-semibold hover:bg-brand hover:text-white transition"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="mb-16 border border-gray-200 rounded-lg p-8 shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Product Description</h2>
        <p className="text-gray-700 leading-relaxed">
          {product.ProductDescription || "No description available."}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Brand:</span>{" "}
            {product.ProductBrand || "N/A"}
          </div>
          <div>
            <span className="font-semibold">Category:</span>{" "}
            {product.ProductCategory}
          </div>
          <div>
            <span className="font-semibold">Made In:</span>{" "}
            {product.ProductMadeIn}
          </div>
          <div>
            <span className="font-semibold">Weight:</span>{" "}
            {currentSku?.Weight ? `${currentSku.Weight}g` : "N/A"}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="border border-gray-200 rounded-lg p-8 shadow-sm">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about this product..."
              className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-brand resize-none"
            />
            <div className="flex justify-end mt-3">
              <button
                type="submit"
                className="px-6 py-2 bg-brand text-white rounded-lg font-semibold hover:bg-opacity-90 transition"
              >
                Post Comment
              </button>
            </div>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No reviews yet. Be the first to review this product!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-200 pb-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-semibold">
                      {comment.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{comment.username}</span>
                      {comment.rating && (
                        <div className="flex text-yellow-500">
                          {"★".repeat(comment.rating)}
                          {"☆".repeat(5 - comment.rating)}
                        </div>
                      )}
                      <span className="text-sm text-gray-500">
                        {comment.timestamp}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.comment}</p>
                    <button className="text-sm text-brand font-semibold hover:underline">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
