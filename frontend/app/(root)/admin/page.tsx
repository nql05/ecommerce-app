"use client";

// Admin Dashboard
import { useEffect, useState } from "react";
import api from "../../../lib/api";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get("/admin/users").then((res) => setUsers(res.data));
  }, []);

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: "rgb(9,10,21)" }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.LoginName}
              className="card flex items-center justify-between p-4"
            >
              <div>
                <div className="font-semibold">{user.UserName}</div>
                <div className="text-sm text-gray-400">{user.LoginName}</div>
              </div>
              <div>
                <button className="btn-primary">Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
