import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import { pocketPalApi, userApi, walletApi, transactionApi, goalApi, categoryApi } from "@repo/auth";

// Get API base URL based on platform
const getApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Android emulator needs 10.0.2.2 to reach host machine
  if (Platform.OS === "android") {
    return "http://10.0.2.2:5757";
  }
  return "http://localhost:5757";
};

const API_URL = getApiUrl();

// Types
export interface User {
  id: string;
  name: string;
  phone: string;
  level: number;
  coins: number;
  avatarUrl: string | null;
  kycCompleted: boolean;
  onboardingCompleted: boolean;
}

export interface WalletData {
  primary: {
    id: string;
    balance: number;
    ppiType: "small_ppi" | "full_kyc_ppi";
    limits: {
      maxBalance: number;
      monthlyLoadLimit: number;
      perTxnLimit: number;
      cashWithdrawal: boolean;
      fundsTransfer: boolean;
      upiEnabled: boolean;
    };
    remainingMonthlyLoad: number;
  };
  savings: {
    id: string;
    balance: number;
  };
  total: number;
  kycCompleted: boolean;
}

export interface Transaction {
  _id: string;
  name: string;
  emoji: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  createdAt: string;
}

export interface Goal {
  _id: string;
  name: string;
  emoji: string;
  category: string;
  color: string;
  targetAmount: number;
  currentAmount: number;
  isFeatured: boolean;
  progress: number;
  isCompleted?: boolean;
}

export interface Category {
  _id: string;
  name: string;
  emoji: string;
  color: string;
}

// Hook for user profile
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userApi.getProfile(API_URL);
      setUser(data.user);
    } catch (err: any) {
      console.error("[useUser] Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [fetchUser])
  );

  return { user, loading, error, refetch: fetchUser };
}

// Hook for wallets
export function useWallets() {
  const [wallets, setWallets] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await walletApi.get(API_URL);
      setWallets(data);
    } catch (err: any) {
      console.error("[useWallets] Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addMoney = useCallback(async (amount: number) => {
    const result = await walletApi.addMoney(API_URL, amount);
    await fetchWallets(); // Refresh after adding
    return result;
  }, [fetchWallets]);

  const transfer = useCallback(async (from: string, to: string, amount: number, sourceGoalId?: string) => {
    const result = await walletApi.transfer(API_URL, from, to, amount, sourceGoalId);
    await fetchWallets(); // Refresh after transfer
    return result;
  }, [fetchWallets]);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchWallets();
    }, [fetchWallets])
  );

  return { wallets, loading, error, refetch: fetchWallets, addMoney, transfer };
}

// Hook for transactions
export function useTransactions(walletType?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transactionApi.list(API_URL, { walletType, limit: 20 });
      setTransactions(data.transactions);
    } catch (err: any) {
      console.error("[useTransactions] Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [walletType]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, error, refetch: fetchTransactions };
}

// Hook for spending summary
export function useSpendingSummary(period: "week" | "month" | "3m" = "week") {
  const [summary, setSummary] = useState<{ totalSpent: number; avgPerDay: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transactionApi.summary(API_URL, period);
      setSummary(data);
    } catch (err: any) {
      console.error("[useSpendingSummary] Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}

// Hook for goals
export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await goalApi.list(API_URL);
      setGoals(data.goals);
    } catch (err: any) {
      console.error("[useGoals] Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGoal = useCallback(async (goalData: {
    name: string;
    emoji?: string;
    category?: string;
    color?: string;
    targetAmount: number;
    isFeatured?: boolean;
  }) => {
    const result = await goalApi.create(API_URL, goalData);
    await fetchGoals(); // Refresh after creating
    return result;
  }, [fetchGoals]);

  const addToGoal = useCallback(async (id: string, amount: number) => {
    const result = await goalApi.addToGoal(API_URL, id, amount);
    await fetchGoals(); // Refresh after adding
    return result;
  }, [fetchGoals]);

  const deleteGoal = useCallback(async (id: string) => {
    const result = await goalApi.delete(API_URL, id);
    await fetchGoals(); // Refresh after deleting
    return result;
  }, [fetchGoals]);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchGoals();
    }, [fetchGoals])
  );

  return { goals, loading, error, refetch: fetchGoals, createGoal, addToGoal, deleteGoal };
}

// Hook for categories
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryApi.list(API_URL);
      setCategories(data.categories);
    } catch (err: any) {
      console.error("[useCategories] Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, refetch: fetchCategories };
}

// Export API URL for direct use
export { API_URL };
