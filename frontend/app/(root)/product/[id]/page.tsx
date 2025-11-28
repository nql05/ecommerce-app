"use client";

import React, { useState, useEffect, useContext, useRef } from "react";
import Image from "next/image";
import {
  Star as LucideStar,
  MoreVertical as LucideMoreVertical,
  Edit as LucideEdit,
  Trash2 as LucideTrash2,
} from "lucide-react";
import api from "../../../../lib/api";
import { API_PATHS } from "../../../../lib/apiPath";
import formatVND from "../../../../utils/formatVND";
import { CartContext } from "../../../../context/CartContext";
import { AuthContext } from "../../../../context/AuthContext";
import QuantityCounter from "../../../../components/QuantityCounter";

const Star = LucideStar as any;
const MoreVertical = LucideMoreVertical as any;
const Edit = LucideEdit as any;
const Trash2 = LucideTrash2 as any;

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSku, setSelectedSku] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState<any[]>([]);
  const [openMenuCommentId, setOpenMenuCommentId] = useState<number | null>(
    null
  );
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(5);
  const cartContext = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuCommentId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setQuantity(1);
  }, [selectedSku]);

  const fetchProductDetails = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const resolvedParams = await params;
      const response = await api.get(
        API_PATHS.BUYER.PRODUCTS.DETAIL(resolvedParams.id)
      );
      const productData = response.data;
      setProduct(productData);

      // Set first SKU as selected by default if not already selected or if selected SKU doesn't exist in new data
      if (productData?.SKU?.length > 0) {
        const skuExists = productData.SKU.some(
          (s: any) => s.SKUName === selectedSku
        );
        if (!selectedSku || !skuExists) {
          setSelectedSku(productData.SKU[0].SKUName);
        }
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
            })) || []
        ) || [];
      setComments(allComments);
    } catch (error) {
      console.error("Failed to fetch product:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [params]);

  const handleAddToCart = async () => {
    try {
      await api.post(API_PATHS.BUYER.CART.GET, {
        ProductID: product.ProductID,
        SKUName: selectedSku,
        Quantity: quantity,
      });
      alert(`Added ${quantity} item(s) to cart!`);
      await cartContext?.fetchCartCount();
      setQuantity(1); // Reset quantity
    } catch (err: any) {
      if (err.response?.status === 400 || err.response?.status === 401) {
        alert("Please login as a buyer to add items to cart.");
      } else {
        alert("Failed to add to cart. Please try again.");
      }
      console.log(err);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await api.post(API_PATHS.BUYER.COMMENTS.ADD, {
        ProductID: product.ProductID,
        SKUName: selectedSku || null,
        Content: newComment,
        Ratings: rating,
      });
      alert("Comment submitted successfully!");
      setNewComment("");
      setRating(5);
      fetchProductDetails(false);
    } catch (err: any) {
      console.error("Failed to submit comment:", err);
      if (err.response?.status === 401) {
        alert("Please login to comment.");
      } else {
        alert("Failed to submit comment. Please try again.");
      }
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await api.delete(API_PATHS.BUYER.COMMENTS.DELETE, {
        data: { commentID: commentId },
      });
      alert("Comment deleted successfully");
      fetchProductDetails(false);
    } catch (err) {
      console.error("Failed to delete comment:", err);
      alert("Failed to delete comment");
    }
  };

  const handleEditComment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(API_PATHS.BUYER.COMMENTS.EDIT, {
        commentID: editingCommentId,
        content: editContent,
        ratings: editRating,
      });
      alert("Comment updated successfully");
      setEditingCommentId(null);
      fetchProductDetails(false);
    } catch (err) {
      console.error("Failed to edit comment:", err);
      alert("Failed to edit comment");
    }
  };

  const startEditing = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.comment);
    setEditRating(comment.rating);
    setOpenMenuCommentId(null);
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

  const handleQuantityChange = (value: number) => {
    setQuantity(value);
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
    currentSku?.SKUImage?.[0]?.SKU_URL || "/images/placeholder.png";
  const price = currentSku?.Price || 0;
  const stock = currentSku?.InStockNumber || 0;

  return (
    <main className="pt-32 pb-16">
      {/* Product Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Image */}
        <div className="w-full aspect-square relative rounded-lg overflow-hidden bg-white">
          {/* @ts-ignore */}
          <Image
            src={imageUrl}
            alt={product.ProductName}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain"
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
              <QuantityCounter
                quantity={quantity}
                maxStock={stock}
                onIncrement={incrementQty}
                onDecrement={decrementQty}
                onChange={handleQuantityChange}
                size="medium"
              />
              <div className="text-sm">
                <span className="text-orange-500 font-semibold">
                  Only {stock} {stock > 1 ? "Items" : "Item"} Left!
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
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl ${
                    star <= rating ? "text-yellow-500" : "text-gray-300"
                  }`}
                >
                  {/* @ts-ignore */}
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating ? "fill-yellow-500" : "fill-transparent"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about this product..."
              className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
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
                {editingCommentId === comment.id ? (
                  <form onSubmit={handleEditComment} className="space-y-4">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setEditRating(star)}
                          className={`text-xl ${
                            star <= editRating
                              ? "text-yellow-500"
                              : "text-gray-300"
                          }`}
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= editRating
                                ? "fill-yellow-500"
                                : "fill-transparent"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-brand"
                      rows={3}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingCommentId(null)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-opacity-90"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex gap-4 items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-semibold">
                        {comment.username.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {comment.username}
                          </span>
                          {comment.rating && (
                            <div className="flex gap-1 text-yellow-500">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < comment.rating
                                      ? "fill-yellow-500"
                                      : "text-gray-300 fill-transparent"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        {user?.loginName === comment.username && (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenMenuCommentId(
                                  openMenuCommentId === comment.id
                                    ? null
                                    : comment.id
                                )
                              }
                              className="p-1 hover:bg-gray-100 rounded-full"
                            >
                              <MoreVertical className="w-5 h-5 text-gray-500" />
                            </button>
                            {openMenuCommentId === comment.id && (
                              <div
                                ref={menuRef}
                                className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-md z-10"
                              >
                                <button
                                  onClick={() => startEditing(comment)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Edit className="w-4 h-4" /> Edit
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteComment(comment.id)
                                  }
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-gray-700">{comment.comment}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
