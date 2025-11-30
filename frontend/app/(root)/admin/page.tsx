"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User as LucideUser,
  Store as LucideStore,
  ShoppingBag as LucideShoppingBag,
  DollarSign as LucideDollarSign,
} from "lucide-react";
import api from "../../../lib/api";
import { API_PATHS } from "../../../lib/apiPath";
import formatVND from "../../../utils/formatVND";

const User = LucideUser as any;
const Store = LucideStore as any;
const ShoppingBag = LucideShoppingBag as any;
const DollarSign = LucideDollarSign as any;

interface Buyer {
  LoginName: string;
  UserName: string;
  Email: string | null;
  PhoneNumber: string | null;
  MoneySpent: number | null;
}

interface Seller {
  LoginName: string;
  UserName: string;
  Email: string | null;
  PhoneNumber: string | null;
  ShopName: string | null;
  SellerName: string | null;
  MoneyEarned: number | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"buyers" | "sellers">("buyers");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [buyersRes, sellersRes] = await Promise.all([
          api.get(API_PATHS.ADMIN.BUYER_LIST),
          api.get(API_PATHS.ADMIN.SELLER_LIST),
        ]);
        setBuyers(buyersRes.data);
        setSellers(sellersRes.data);
      } catch (err: any) {
        console.error("Failed to fetch admin data:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          alert("⚠️ Unauthorized access. Admin privileges required.");
          router.push("/role");
        } else {
          const errorMsg = err.response?.data?.error || err.message || "Unknown error occurred";
          alert(`❌ Unable to load admin data: ${errorMsg}.\n\nPlease try refreshing the page or login again.`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <main className="pt-32 pb-16">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading admin data...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-32 pb-16">
      <div className="w-full mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-brand">Admin Dashboard</h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Buyers</p>
                <p className="text-2xl font-bold text-blue-600">
                  {buyers.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Store className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Sellers</p>
                <p className="text-2xl font-bold text-purple-600">
                  {sellers.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("buyers")}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === "buyers"
                ? "border-b-2 border-brand text-brand"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Buyers ({buyers.length})
          </button>
          <button
            onClick={() => setActiveTab("sellers")}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === "sellers"
                ? "border-b-2 border-brand text-brand"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sellers ({sellers.length})
          </button>
        </div>

        {/* Buyers List */}
        {activeTab === "buyers" && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Login Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Display Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                      Money Spent
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {buyers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">
                        <p className="text-gray-500">No buyers found</p>
                      </td>
                    </tr>
                  ) : (
                    buyers.map((buyer) => (
                      <tr
                        key={buyer.LoginName}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="font-semibold">
                              {buyer.LoginName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {buyer.UserName}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {buyer.Email || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {buyer.PhoneNumber || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-brand">
                          {formatVND(buyer.MoneySpent || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sellers List */}
        {activeTab === "sellers" && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Login Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Shop Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Seller Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                      Money Earned
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sellers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center">
                        <p className="text-gray-500">No sellers found</p>
                      </td>
                    </tr>
                  ) : (
                    sellers.map((seller) => (
                      <tr
                        key={seller.LoginName}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <Store className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className="font-semibold">
                              {seller.LoginName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-purple-600">
                            {seller.ShopName || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {seller.SellerName || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {seller.Email || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {seller.PhoneNumber || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-brand">
                          {formatVND(seller.MoneyEarned || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
