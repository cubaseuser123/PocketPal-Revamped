import { useQuery } from "@tanstack/react-query";
import { userApi } from "@repo/auth";
import { API_URL } from "./useUser";

export interface DashboardData {
  user: {
    id: string;
    name: string;
    phone: string;
    level: number;
    coins: number;
    avatarUrl: string | null;
    kycCompleted: boolean;
    onboardingCompleted: boolean;
    friendCode: string | null;
  };
  wallets: {
    primary: { balance: number };
    savings: { balance: number };
    total: number;
  };
  goals: Array<{
    id: string;
    name: string;
    emoji: string;
    category: string;
    color: string;
    targetAmount: number;
    currentAmount: number;
    isFeatured: boolean;
    progress: number;
    isCompleted?: boolean;
    createdAt?: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
  }>;
  spendingSummary: {
    week: { totalSpent: number; avgPerDay: number };
    month: { totalSpent: number; avgPerDay: number };
    "3m": { totalSpent: number; avgPerDay: number };
  };
}

export function useDashboard() {
  const {
    data: dashboard,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const data = await userApi.getDashboard(API_URL);
      return data as DashboardData;
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    dashboard,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
