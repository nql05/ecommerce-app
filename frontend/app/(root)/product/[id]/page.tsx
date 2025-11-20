"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Minus, Plus, User } from "lucide-react";

// Dummy product data
const productData: Record<string, any> = {
  "1": {
    id: 1,
    name: "Wireless Earbuds, IPX8",
    price: 890000,
    imageUrl:
      "https://i5.walmartimages.com/seo/Wireless-Earbuds-Bluetooth-5-0-Headphones-IPX8-Waterproof-Hight-Fidelity-Stereo-Sound-Quality-Ear-Headset-Built-in-Mic-LED-Charging-Case-21-Hours-Pla_a7e7bef7-f039-4d00-bfe4-15676c26ad7c.24eca05c39f5baa6894dc7c693055b49.jpeg?odnHeight=573&odnWidth=573&odnBg=FFFFFF",
    skus: [
      { id: "sku1", color: "Black", available: true },
      { id: "sku2", color: "White", available: true },
      { id: "sku3", color: "Blue", available: false },
    ],
    description:
      "Organic Cotton, fairtrade certified. Experience premium sound quality with IPX8 waterproof rating. Perfect for workouts and daily commutes. Includes charging case with 21 hours of playtime.",
    stock: 12,
  },
  "2": {
    id: 2,
    name: "AirPods Max",
    price: 15590000,
    imageUrl: "https://i5.walmartimages.com/seo/AirPods-Max-Starlight_bed55a38-17a8-4625-9fe1-421cc1a52408.1eacde98e237918a46bc33e137f8ff37.jpeg?odnHeight=2000&odnWidth=2000&odnBg=FFFFFF",
    skus: [
      { id: "sku1", color: "Space Gray", available: true },
      { id: "sku2", color: "Silver", available: true },
      { id: "sku3", color: "Sky Blue", available: true },
      { id: "sku4", color: "Green", available: true },
      { id: "sku5", color: "Pink", available: true },
    ],
    description:
      "A perfect balance of exhilarating high-fidelity audio and the effortless magic of AirPods. Computational audio combines custom acoustic design with the Apple H1 chip and software for breakthrough listening experiences.",
    stock: 8,
  },
};

// Dummy comments
const dummyComments = [
  {
    id: 1,
    username: "John Doe",
    comment:
      "Amazing product! The sound quality is incredible and battery life exceeds expectations.",
    timestamp: "2 days ago",
  },
  {
    id: 2,
    username: "Sarah Chen",
    comment: "Worth every penny. Very comfortable for long listening sessions.",
    timestamp: "1 week ago",
  },
  {
    id: 3,
    username: "Mike Wilson",
    comment: "Great purchase! Shipping was fast and packaging was excellent.",
    timestamp: "2 weeks ago",
  },
];

function formatVND(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const product = productData[params.id] || productData["1"];
  const [selectedSku, setSelectedSku] = useState(product.skus[0].id);
  const [quantity, setQuantity] = useState(1);
  const [newComment, setNewComment] = useState("");

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
    if (quantity < product.stock) setQuantity(quantity + 1);
  };

  const decrementQty = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  return (
    <main className="pt-32 pb-16">
      {/* Product Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Image */}
        <div className="w-full aspect-square relative rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>

        {/* Product Details */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

          {/* Price */}
          <div className="text-3xl font-bold text-brand mb-6">
            {formatVND(product.price)}
          </div>

          {/* SKU Selection */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Choose a Color</h3>
            <div className="flex gap-3 flex-wrap">
              {product.skus.map((sku: any) => (
                <button
                  key={sku.id}
                  onClick={() => sku.available && setSelectedSku(sku.id)}
                  disabled={!sku.available}
                  className={`px-4 py-2 rounded-full border-2 transition ${
                    selectedSku === sku.id
                      ? "border-brand bg-brand text-white"
                      : sku.available
                      ? "border-gray-300 hover:border-brand"
                      : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {sku.color}
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
                  Only {product.stock} Items Left!
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
        <p className="text-gray-700 leading-relaxed">{product.description}</p>
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
          {dummyComments.map((comment) => (
            <div
              key={comment.id}
              className="border-b border-gray-200 pb-6"
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <User
                    alt={comment.username}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{comment.username}</span>
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
          ))}
        </div>
      </div>
    </main>
  );
}
