import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { storage } from "../storage/storage";
import { AuthContextValue, AuthProviderProps } from "../types";
import { authEvents } from "../events";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, onLogout }: AuthProviderProps) {
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

  // Logout function - clears all auth-related storage
  const logout = useCallback(async () => {
    try {
      console.log("[Auth] Logging out...");
      
      // External cleanup first (e.g. query cache)
      if (onLogout) {
        await onLogout();
      }

      await storage.remove("access_token");
      setAuthenticated(false);
      console.log("[Auth] Logout complete");
    } catch (error) {
      console.error("[Auth] Logout error:", error);
    }
  }, [onLogout]);

  useEffect(() => {
    // Listen for forced logout events (e.g. 401 from API)
    const unsubscribe = authEvents.on("logout", async () => {
      console.log("[Auth] Received logout event");
      
      if (onLogout) {
        await onLogout();
      }
      
      setAuthenticated(false);
    });
    return unsubscribe;
  }, [onLogout]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        const token = await storage.get("access_token");
        console.log("[Auth] App state check - token found:", !!token);
        setAuthenticated(!!token);
      }
    };

    // Use AppState for native, document.visibilityState for web
    if (Platform.OS === "web" && typeof document !== "undefined") {
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
    } else {
      const subscription = AppState.addEventListener("change", handleAppStateChange);
      return () => {
        subscription.remove();
      };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, setAuthenticated, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

