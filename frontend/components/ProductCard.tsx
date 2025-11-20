"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

export interface ProductCardProps {
  id?: number;
  imageUrl: string;
  name: string;
  price: number; // raw number in VND
}

function formatVND(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export default function ProductCard({
  id,
  imageUrl,
  name,
  price,
}: ProductCardProps) {
  return (
    <Link href={`/product/${id || 1}`} className="block">
      <div className="group rounded-lg p-3 shadow-sm hover:shadow-md transition bg-white flex flex-col cursor-pointer">
        <div className="w-full aspect-square relative mb-3 overflow-hidden rounded-md bg-gray-100">
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width:768px) 50vw, (max-width:1200px) 25vw, 300px"
            className="object-cover group-hover:scale-105 transition"
          />
        </div>
        <h3 className="text-sm font-medium line-clamp-2 mb-2">{name}</h3>
        <div className="mt-auto text-brand font-semibold">
          {formatVND(price)}
        </div>
      </div>
    </Link>
  );
}
