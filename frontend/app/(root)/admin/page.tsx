"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { API_PATHS } from "../../../lib/apiPath";
import { Edit, Shield } from "lucide-react";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Note: This might need to be updated based on actual admin API endpoint
    api
      .get("/admin/users")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Failed to fetch users:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="pt-32 pb-16">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-brand" />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg">No users found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {users.map((user) => (
            <div
              key={user.LoginName}
              className="bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-between hover:shadow-md transition"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-semibold">
                    {user.UserName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{user.UserName}</h3>
                    <p className="text-sm text-gray-600">{user.LoginName}</p>
                  </div>
                </div>
                <div className="ml-13 text-sm text-gray-500">
                  {user.Email && <span>Email: {user.Email}</span>}
                  {user.PhoneNumber && (
                    <span className="ml-4">Phone: {user.PhoneNumber}</span>
                  )}
                </div>
              </div>
              <div>
                <button className="flex items-center gap-2 px-4 py-2 border-2 border-brand text-brand rounded-lg hover:bg-brand hover:text-white transition">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
