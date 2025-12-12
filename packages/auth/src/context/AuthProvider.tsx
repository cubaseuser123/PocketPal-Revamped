import { createContext, useContext, useState, useEffect } from "react";
import { storage } from "../storage/storage";
import { AuthContextValue, AuthProviderProps } from "../types";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await storage.get("access_token");
        console.log("[Auth] Token found:", !!token);
        setAuthenticated(!!token);
      } catch (error) {
        console.error("[Auth] Error checking:", error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        const token = await storage.get("access_token");
        console.log("[Auth] Visibility check - token found:", !!token);
        setAuthenticated(!!token);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, setAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
