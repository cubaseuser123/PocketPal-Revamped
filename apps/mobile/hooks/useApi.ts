import { useCallback } from "react";
import { Platform } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, walletApi, transactionApi, goalApi, categoryApi, subscriptionApi } from "@repo/auth";

// Get API base URL based on platform
// For physical device: use ngrok URL
// For emulator/web: use localhost
const NGROK_URL = "https://transformational-philatelically-fiona.ngrok-free.dev";

const getApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // For physical Android device, use ngrok
  if (Platform.OS === "android") {
    // Check if running on emulator (10.0.2.2 works) or physical device (needs ngrok)
    // Using ngrok for now - physical device can't reach localhost
    return NGROK_URL;
  }
  // iOS physical device also needs ngrok
  if (Platform.OS === "ios") {
    return NGROK_URL;
  }
  // Web uses localhost
  return "http://localhost:5757";
};

const API_URL = getApiUrl();

export const getFullAvatarUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  // Remove leading slash if API_URL ends with one, or ensure slash exists
  // consistently handles /uploads/xxx
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

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
  createdAt?: string;
  _isOffline?: boolean; // Marks optimistically created goals
}

export interface Category {
  _id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface Subscription {
  _id: string;
  name: string;
  price: number;
  category: string;
  startDate: string;
  renewalCycle: string;
  status: string;
  nextRenewal: string;
}

// Hook for user profile
export function useUser() {
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const data = await userApi.getProfile(API_URL);
      return data.user as User;
    },
  });

  const queryClient = useQueryClient();

  const updateUserMutation = useMutation({
    mutationFn: async (data: { name?: string; avatarUrl?: string }) => {
      return await userApi.updateProfile(API_URL, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const updateUser = useCallback(async (data: { name?: string; avatarUrl?: string }) => {
    return await updateUserMutation.mutateAsync(data);
  }, [updateUserMutation]);

  return { user, loading: isLoading, error: error ? (error as Error).message : null, refetch, updateUser };
}

// Hook for wallets
export function useWallets() {
  const queryClient = useQueryClient();

  const { data: wallets, isLoading, error, refetch } = useQuery({
    queryKey: ["wallets"],
    queryFn: async () => {
      const data = await walletApi.get(API_URL);
      return data as WalletData;
    },
  });

  const addMoneyMutation = useMutation({
    mutationFn: async (amount: number) => {
      return await walletApi.addMoney(API_URL, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["spendingSummary"] });
    },
  });

  const transferMutation = useMutation({
    mutationFn: async ({ from, to, amount, sourceGoalId }: { from: string; to: string; amount: number; sourceGoalId?: string }) => {
      // @ts-ignore - The type definition in @repo/auth might be stale, but the source code has 5 arguments.
      return await walletApi.transfer(API_URL, from, to, amount, sourceGoalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["spendingSummary"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] }); // Goals might change if transfer involves them
    },
  });

  const addMoney = useCallback(async (amount: number) => {
    return await addMoneyMutation.mutateAsync(amount);
  }, [addMoneyMutation]);

  const transfer = useCallback(async (from: string, to: string, amount: number, sourceGoalId?: string) => {
    return await transferMutation.mutateAsync({ from, to, amount, sourceGoalId });
  }, [transferMutation]);

  return { 
    wallets, 
    loading: isLoading, 
    error: error ? (error as Error).message : null, 
    refetch, 
    addMoney, 
    transfer 
  };
}

// Hook for transactions
export function useTransactions(walletType?: string) {
  const { data: transactions, isLoading, error, refetch } = useQuery({
    queryKey: ["transactions", { walletType }],
    queryFn: async () => {
      const data = await transactionApi.list(API_URL, { walletType, limit: 20 });
      return data.transactions as Transaction[];
    },
  });

  return { transactions: transactions || [], loading: isLoading, error: error ? (error as Error).message : null, refetch };
}

// Hook for spending summary
export function useSpendingSummary(period: "week" | "month" | "3m" = "week") {
  const { data: summary, isLoading, error, refetch } = useQuery({
    queryKey: ["spendingSummary", period],
    queryFn: async () => {
      const data = await transactionApi.summary(API_URL, period);
      return data as { totalSpent: number; avgPerDay: number };
    },
  });

  return { summary, loading: isLoading, error: error ? (error as Error).message : null, refetch };
}

// Hook for goals
export function useGoals() {
  const queryClient = useQueryClient();

  const { data: goals, isLoading, error, refetch } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const data = await goalApi.list(API_URL);
      return data.goals as Goal[];
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goalData: {
      name: string;
      emoji?: string;
      category?: string;
      color?: string;
      targetAmount: number;
      isFeatured?: boolean;
    }) => {
      return await goalApi.create(API_URL, goalData);
    },
    // Optimistic update - add goal to cache immediately
    onMutate: async (newGoal) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["goals"] });
      
      // Snapshot the previous value
      const previousGoals = queryClient.getQueryData<Goal[]>(["goals"]);
      
      // Optimistically update to the new value
      const optimisticGoal: Goal = {
        _id: `temp-${Date.now()}`, // Temporary ID
        name: newGoal.name,
        emoji: newGoal.emoji || "🎯",
        category: newGoal.category || "General",
        color: newGoal.color || "#FF8C32",
        targetAmount: newGoal.targetAmount,
        currentAmount: 0,
        progress: 0,
        isFeatured: newGoal.isFeatured || false,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        _isOffline: true, // Mark as offline-created
      };
      
      queryClient.setQueryData<Goal[]>(["goals"], (old) => 
        old ? [...old, optimisticGoal] : [optimisticGoal]
      );
      
      // Return context for rollback
      return { previousGoals };
    },
    onError: (err, newGoal, context) => {
      // If the mutation fails, use context returned from onMutate to roll back
      if (context?.previousGoals) {
        queryClient.setQueryData(["goals"], context.previousGoals);
      }
      console.error("Goal creation failed, will retry when online:", err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onSettled: () => {
      // Always refetch after error or success to sync
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    // Retry configuration for network failures
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const addToGoalMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      return await goalApi.addToGoal(API_URL, id, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] }); // Money taken from wallet
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      return await goalApi.delete(API_URL, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] }); // Money returned to wallet? Usually yes, depends on backend logic
    },
  });

  const createGoal = useCallback(async (goalData: {
    name: string;
    emoji?: string;
    category?: string;
    color?: string;
    targetAmount: number;
    isFeatured?: boolean;
  }) => {
    return await createGoalMutation.mutateAsync(goalData);
  }, [createGoalMutation]);

  const addToGoal = useCallback(async (id: string, amount: number) => {
    return await addToGoalMutation.mutateAsync({ id, amount });
  }, [addToGoalMutation]);

  const deleteGoal = useCallback(async (id: string) => {
    return await deleteGoalMutation.mutateAsync(id);
  }, [deleteGoalMutation]);

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await goalApi.update(API_URL, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const updateGoal = useCallback(async (id: string, data: any) => {
    return await updateGoalMutation.mutateAsync({ id, data });
  }, [updateGoalMutation]);

  return { goals: goals || [], loading: isLoading, error: error ? (error as Error).message : null, refetch, createGoal, addToGoal, deleteGoal, updateGoal };
}

// Hook for categories
export function useCategories() {
  const { data: categories, isLoading, error, refetch } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const data = await categoryApi.list(API_URL);
      return data.categories as Category[];
    },
  });

  return { categories: categories || [], loading: isLoading, error: error ? (error as Error).message : null, refetch };
}

// Hook for subscriptions
export function useSubscriptions() {
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading, error, refetch } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const data = await subscriptionApi.getActive(API_URL);
      return data.subscriptions as Subscription[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const addSubscriptionMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      price: number;
      category?: string;
      startDate: string;
      renewalCycle?: string;
    }) => {
      return await subscriptionApi.add(API_URL, data);
    },
    // Optimistic update - add subscription immediately
    onMutate: async (newSub) => {
      await queryClient.cancelQueries({ queryKey: ["subscriptions"] });
      const previousSubs = queryClient.getQueryData<Subscription[]>(["subscriptions"]);
      
      const optimisticSub: Subscription = {
        _id: `temp-${Date.now()}`,
        name: newSub.name,
        price: newSub.price,
        category: newSub.category || "general",
        startDate: newSub.startDate,
        renewalCycle: newSub.renewalCycle || "monthly",
        status: "active",
        nextRenewal: newSub.startDate, // Will be corrected on sync
      };
      
      queryClient.setQueryData<Subscription[]>(["subscriptions"], (old) =>
        old ? [...old, optimisticSub] : [optimisticSub]
      );
      
      return { previousSubs };
    },
    onError: (err, newSub, context) => {
      if (context?.previousSubs) {
        queryClient.setQueryData(["subscriptions"], context.previousSubs);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["spendingSummary"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await subscriptionApi.cancel(API_URL, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  const addSubscription = useCallback(async (data: {
    name: string;
    price: number;
    category?: string;
    startDate: string;
    renewalCycle?: string;
  }) => {
    return await addSubscriptionMutation.mutateAsync(data);
  }, [addSubscriptionMutation]);

  const cancelSubscription = useCallback(async (id: string) => {
    return await cancelSubscriptionMutation.mutateAsync(id);
  }, [cancelSubscriptionMutation]);

  return { 
    subscriptions: subscriptions || [], 
    loading: isLoading, 
    error: error ? (error as Error).message : null, 
    refetch, 
    addSubscription, 
    cancelSubscription 
  };
}

// Hook for Boss Battle
export interface BossBattle {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  emoji: string;
  sidekickEmoji?: string;
  totalHealth: number;
  currentHealth: number;
  rewards: { coins: number; xp: number };
  status: "active" | "defeated" | "upcoming";
  leaderboard: Array<{ userId: { _id: string; name: string; avatarUrl: string | null }; damage: number }>;
}

export function useBoss() {
  const queryClient = useQueryClient();

  const { data: boss, isLoading, error, refetch } = useQuery({
    queryKey: ["boss"],
    queryFn: async () => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/boss/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json() as BossBattle;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const dealDamageMutation = useMutation({
    mutationFn: async ({ bossId, amount }: { bossId: string; amount: number }) => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/boss/${bossId}/damage`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boss"] });
    },
  });

  const dealDamage = useCallback(async (bossId: string, amount: number) => {
    return await dealDamageMutation.mutateAsync({ bossId, amount });
  }, [dealDamageMutation]);

  return { boss, loading: isLoading, error: error ? (error as Error).message : null, refetch, dealDamage };
}

// Hook for Quests
export interface Quest {
  _id: string;
  title: string;
  description: string;
  type: string;
  requirement: { action: string; target: number };
  rewards: { coins: number; xp: number };
  difficulty: "easy" | "medium" | "hard";
  progress: number;
  completed: boolean;
  expiresAt: string;
}

export function useQuests() {
  const queryClient = useQueryClient();

  const { data: quests, isLoading, error, refetch } = useQuery({
    queryKey: ["quests"],
    queryFn: async () => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/quests/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json() as Quest[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const assignQuestsMutation = useMutation({
    mutationFn: async () => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/quests/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ count: 3 }),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quests"] });
    },
  });

  const assignQuests = useCallback(async () => {
    return await assignQuestsMutation.mutateAsync();
  }, [assignQuestsMutation]);

  return { quests: quests || [], loading: isLoading, error: error ? (error as Error).message : null, refetch, assignQuests };
}

// Hook for Savings Wheel
export interface WheelStatus {
  canSpin: boolean;
  lastSpinDate: string | null;
  segments: Array<{ id: number; label: string; reward: number; color: string }>;
}

export function useWheel() {
  const queryClient = useQueryClient();

  const { data: wheelStatus, isLoading, error, refetch } = useQuery({
    queryKey: ["wheel"],
    queryFn: async () => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/wheel/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json() as WheelStatus;
    },
  });

  const spinMutation = useMutation({
    mutationFn: async () => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/wheel/spin`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wheel"] });
      queryClient.invalidateQueries({ queryKey: ["user"] }); // Coins update
    },
  });

  const spin = useCallback(async () => {
    return await spinMutation.mutateAsync();
  }, [spinMutation]);

  return { wheelStatus, loading: isLoading, error: error ? (error as Error).message : null, refetch, spin };
}

// Export API URL for direct use
export { API_URL };

