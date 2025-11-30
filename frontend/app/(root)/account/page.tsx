"use client";

import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import {
  User as LucideUser,
  Mail as LucideMail,
  Phone as LucidePhone,
  Calendar as LucideCalendar,
  MapPin as LucideMapPin,
  DollarSign as LucideDollarSign,
  Store as LucideStore,
} from "lucide-react";
import api from "../../../lib/api";
import { API_PATHS } from "../../../lib/apiPath";
import { AuthContext } from "../../../context/AuthContext";
import formatVND from "../../../utils/formatVND";

const User = LucideUser as any;
const Mail = LucideMail as any;
const Phone = LucidePhone as any;
const Calendar = LucideCalendar as any;
const MapPin = LucideMapPin as any;
const DollarSign = LucideDollarSign as any;
const Store = LucideStore as any;

interface UserProfile {
  LoginName: string;
  UserName: string;
  Email: string | null;
  PhoneNumber: string | null;
  Gender: boolean | null;
  BirthDate: string | null;
  Age: number | null;
  Address: string | null;
  MoneySpent?: number | null;
  ShopName?: string | null;
  SellerName?: string | null;
  MoneyEarned?: number | null;
}

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(API_PATHS.AUTH.PROFILE);
        setProfile(response.data);
      } catch (err: any) {
        console.error("Failed to fetch profile:", err);
        if (err.response?.status === 401) {
          alert("⚠️ Please login to view your profile");
          router.push("/role");
        } else {
          const errorMsg = err.response?.data?.error || err.message || "Unknown error occurred";
          alert(`❌ Unable to load profile: ${errorMsg}.\n\nPlease try refreshing the page or login again.`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  if (loading) {
    return (
      <main className="pt-32 pb-16">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="pt-32 pb-16">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">❌ Profile not found. Please login again.</p>
        </div>
      </main>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const year = date.getFullYear();

    // Add ordinal suffix (st, nd, rd, th)
    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
        ? "rd"
        : "th";

    return `${day}${suffix} ${month}, ${year}`;
  };

  return (
    <main className="pt-32 pb-16">
      <div className="w-full mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>

        <div className="space-y-6">
          {/* Profile Info Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Profile Information</h2>

            <div className="space-y-4">
              {/* Login Name */}
              <div className="flex items-center gap-4">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Login Name</p>
                  <p className="font-semibold">{profile.LoginName}</p>
                </div>
              </div>

              {/* Display Name */}
              <div className="flex items-center gap-4">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Display Name</p>
                  <p className="font-semibold">{profile.UserName}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-4">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold">{profile.Email || "N/A"}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-4">
                <Phone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-semibold">
                    {profile.PhoneNumber || "N/A"}
                  </p>
                </div>
              </div>

              {/* Gender */}
              <div className="flex items-center gap-4">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-semibold">
                    {profile.Gender === null
                      ? "N/A"
                      : profile.Gender
                      ? "Male"
                      : "Female"}
                  </p>
                </div>
              </div>

              {/* Birth Date */}
              <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Birth Date</p>
                  <p className="font-semibold">
                    {formatDate(profile.BirthDate)}
                  </p>
                </div>
              </div>

              {/* Age */}
              {profile.Age && (
                <div className="flex items-center gap-4">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="font-semibold">{profile.Age} years old</p>
                  </div>
                </div>
              )}

              {/* Address */}
              <div className="flex items-center gap-4">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-semibold">{profile.Address || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Buyer Stats */}
          {profile.MoneySpent !== null && profile.MoneySpent !== undefined && (
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Buyer Statistics</h2>
              <div className="flex items-center gap-4">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Total Money Spent</p>
                  <p className="font-bold text-brand text-2xl">
                    {formatVND(profile.MoneySpent)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Seller Stats */}
          {profile.ShopName && (
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Seller Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Store className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500">Shop Name</p>
                    <p className="font-semibold">{profile.ShopName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <User className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500">Seller Name</p>
                    <p className="font-semibold">{profile.SellerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Total Earnings</p>
                    <p className="font-bold text-brand text-2xl">
                      {formatVND(profile.MoneyEarned || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
