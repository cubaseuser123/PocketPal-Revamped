import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authClient } from "../client";
import type { User, LoginData, RegisterData } from "../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
  autoRefresh?: boolean;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  autoRefresh = true,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (authClient.isAuthenticated()) {
      try {
        const userData = await authClient.getMe();
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        authClient.logout();
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    if (autoRefresh) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, [autoRefresh, refreshUser]);

  const login = async (data: LoginData) => {
    try {
      const response = await authClient.login(data);
      if (response.user) {
        setUser(response.user);
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await authClient.register(data);
      // Auto-login after registration
      const loginResponse = await authClient.login({
        email: data.email,
        password: data.password,
      });
      if (loginResponse.user) {
        setUser(loginResponse.user);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authClient.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
