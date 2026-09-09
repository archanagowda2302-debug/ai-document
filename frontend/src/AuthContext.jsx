import { useEffect, useState } from "react";
import { apiRequest } from "./api";
import { AuthContext, tokenKey } from "./authState";

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(tokenKey)));

  useEffect(() => {
    if (!localStorage.getItem(tokenKey)) {
      return;
    }
    apiRequest("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem(tokenKey))
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const data = await apiRequest("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials) });
    localStorage.setItem(tokenKey, data.token);
    setUser(data.user);
  };

  const register = async (details) => apiRequest("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(details) });
  const logout = () => { localStorage.removeItem(tokenKey); setUser(null); window.history.replaceState(null, "", "/login"); };

  return <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export { AuthProvider };
