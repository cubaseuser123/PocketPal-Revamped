import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { goalApi, categoryApi, subscriptionApi } from "@repo/auth";
import { API_URL } from "./useUser";

export interface Goal {
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
  _isOffline?: boolean;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface Subscription {
  id: string;
  name: string;
  price: number;
  category: string;
  startDate: string;
  renewalCycle: string;
  status: string;
  nextRenewal: string;
}

export function useGoals() {
  const queryClient = useQueryClient();

  const {
    data: goals,
    isLoading,
    error,
    refetch,
  } = useQuery({
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
    // Optimistic update
    onMutate: async (newGoal) => {
      await queryClient.cancelQueries({ queryKey: ["goals"] });
      const previousGoals = queryClient.getQueryData<Goal[]>(["goals"]);

      const optimisticGoal: Goal = {
        id: `temp-${Date.now()}`,
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
        _isOffline: true,
      };

      queryClient.setQueryData<Goal[]>(["goals"], (old) =>
        old ? [...old, optimisticGoal] : [optimisticGoal],
      );
      return { previousGoals };
    },
    onError: (err, newGoal, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(["goals"], context.previousGoals);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    retry: 3,
  });

  const addToGoalMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      return await goalApi.addToGoal(API_URL, id, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      return await goalApi.delete(API_URL, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
  });

  const createGoal = useCallback(
    async (goalData: any) => {
      return await createGoalMutation.mutateAsync(goalData);
    },
    [createGoalMutation],
  );

  const addToGoal = useCallback(
    async (id: string, amount: number) => {
      return await addToGoalMutation.mutateAsync({ id, amount });
    },
    [addToGoalMutation],
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      return await deleteGoalMutation.mutateAsync(id);
    },
    [deleteGoalMutation],
  );

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await goalApi.update(API_URL, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const updateGoal = useCallback(
    async (id: string, data: any) => {
      return await updateGoalMutation.mutateAsync({ id, data });
    },
    [updateGoalMutation],
  );

  return {
    goals: goals || [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
    createGoal,
    addToGoal,
    deleteGoal,
    updateGoal,
  };
}

export function useCategories() {
  const {
    data: categories,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const data = await categoryApi.list(API_URL);
      return data.categories as Category[];
    },
  });

  return {
    categories: categories || [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}

export function useSubscriptions() {
  const queryClient = useQueryClient();

  const {
    data: subscriptions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const data = await subscriptionApi.getActive(API_URL);
      return data.subscriptions as Subscription[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const addSubscriptionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await subscriptionApi.add(API_URL, data);
    },
    onMutate: async (newSub) => {
      await queryClient.cancelQueries({ queryKey: ["subscriptions"] });
      const previousSubs = queryClient.getQueryData<Subscription[]>([
        "subscriptions",
      ]);

      const optimisticSub: Subscription = {
        id: `temp-${Date.now()}`,
        name: newSub.name,
        price: newSub.price,
        category: newSub.category || "general",
        startDate: newSub.startDate,
        renewalCycle: newSub.renewalCycle || "monthly",
        status: "active",
        nextRenewal: newSub.startDate,
      };

      queryClient.setQueryData<Subscription[]>(["subscriptions"], (old) =>
        old ? [...old, optimisticSub] : [optimisticSub],
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
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await subscriptionApi.cancel(API_URL, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  const addSubscription = useCallback(
    async (data: any) => {
      return await addSubscriptionMutation.mutateAsync(data);
    },
    [addSubscriptionMutation],
  );

  const cancelSubscription = useCallback(
    async (id: string) => {
      return await cancelSubscriptionMutation.mutateAsync(id);
    },
    [cancelSubscriptionMutation],
  );

  return {
    subscriptions: subscriptions || [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
    addSubscription,
    cancelSubscription,
  };
}
