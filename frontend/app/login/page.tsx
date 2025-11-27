"use client";

import { useState, useContext } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "../../lib/api";
import { API_PATHS } from "../../lib/apiPath";
import { AuthContext } from "../../context/AuthContext";

export default function Login() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "B"; // Default to buyer
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useContext(AuthContext);

  const getRoleDisplay = () => {
    switch (role) {
      case "B":
        return "Buyer";
      case "S":
        return "Seller";
      case "A":
        return "Admin";
      default:
        return "User";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post(API_PATHS.AUTH.LOGIN, {
        loginName,
        password,
        role,
      });
      const data = res.data;
      if (data.token) {
        login(data.token, data.role);
         if (data.role === "S") {
          router.push("/seller");
        } else {
          router.push("/product");
        }
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError("Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand mb-2">
            Welcome Back, {getRoleDisplay()}
          </h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-lg btn-primary hover:opacity-90 transition-opacity text-base font-medium"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
