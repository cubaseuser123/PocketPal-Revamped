import { createContext, useContext, useState, useEffect } from "react";
import { cookies } from "../cookies/cookies";
import { AuthContextValue, AuthProviderProps } from "../types";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cookies.get("access_token").then((token) => {
      setAuthenticated(!!token);
      setLoading(false);
    });
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
