"use client";

import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { AuthContext } from "../../../context/AuthContext";

export default function Login() {
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", { loginName, password });
      const data = res.data;
      if (data.token) {
        login(data.token, data.role);
        router.push("/");
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError("Login failed");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "rgb(9,10,21)" }}
    >
      <div className="w-full max-w-2xl mx-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="p-8 rounded-xl card">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-lg"
              style={{ backgroundColor: "#16a394" }}
            />
            <div>
              <h2 className="text-xl font-bold">E-Shop</h2>
              <p className="text-sm text-gray-300">
                Welcome back — sign in to continue.
              </p>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-4">Sign In</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              placeholder="Login Name"
              className="w-full p-3 rounded bg-[rgba(255,255,255,0.02)] text-white border border-[rgba(255,255,255,0.06)] focus:outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 rounded bg-[rgba(255,255,255,0.02)] text-white border border-[rgba(255,255,255,0.06)] focus:outline-none"
            />
            {error && <div className="text-red-400 text-center">{error}</div>}
            <button
              type="submit"
              className="w-full py-3 rounded btn-primary hover:opacity-95 transition"
            >
              Sign In
            </button>
          </form>
          <div className="mt-6 text-xs text-gray-400 text-center">
            <div>Sample account for testing:</div>
            <div>
              <span className="font-bold text-white">Login Name:</span> buyer1
            </div>
            <div>
              <span className="font-bold text-white">Password:</span>{" "}
              password123
            </div>
            <div>
              <span className="font-bold text-white">Role:</span> buyer
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
