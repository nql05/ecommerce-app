"use client";

import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    const storedLoginName = localStorage.getItem("loginName");
    if (storedToken && storedRole) {
      setToken(storedToken);
      setUser({
        token: storedToken,
        role: storedRole,
        loginName: storedLoginName,
      });
    }
  }, []);

  const login = (newToken, role, loginName) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    localStorage.setItem("role", role);
    localStorage.setItem("loginName", loginName);
    setUser({ token: newToken, role, loginName });
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("loginName");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
