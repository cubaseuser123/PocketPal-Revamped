import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pocketPalApi } from "@repo/auth";
import { API_URL } from "./useUser";

export interface SplitGroup {
  _id: string;
  name: string;
  creator: string;
  members: string[];
  totalAmount: number;
  status: "active" | "settled";
  createdAt: string;
  myStatus?: "collecting" | "pending" | "paid" | "unknown";
}

export interface SplitExpense {
  _id: string;
  groupId: string;
  payer: { _id: string; name: string; avatarUrl?: string };
  ower: { _id: string; name: string; avatarUrl?: string };
  amount: number;
  status: "pending" | "paid";
}

export function useSplitGroups() {
  const { data: groups, isLoading, error, refetch } = useQuery({
    queryKey: ["splitGroups"],
    queryFn: async () => {
      const data = await pocketPalApi.splitGroups.list(API_URL);
      return data as SplitGroup[];
    },
  });

  return { groups: groups || [], loading: isLoading, error, refetch };
}

export function useSplitGroupDetails(id: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["splitGroup", id],
    queryFn: async () => {
      if (!id) return null;
      return await pocketPalApi.splitGroups.getDetails(API_URL, id);
    },
    enabled: !!id,
  });

  const payShareMutation = useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
        return await pocketPalApi.splitGroups.pay(API_URL, id, amount);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["splitGroup", id] });
        queryClient.invalidateQueries({ queryKey: ["wallets"] }); // Update wallet balance
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
    }
  });

  const payShare = useCallback(async (amount: number) => {
    return await payShareMutation.mutateAsync({ amount });
  }, [payShareMutation]);

  return { 
    group: data?.group, 
    expenses: data?.expenses as SplitExpense[], 
    loading: isLoading, 
    error, 
    refetch,
    payShare 
  };
}

export function useCreateSplitGroup() {
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: async (data: { name: string; totalAmount: number; members: string[] }) => {
            return await pocketPalApi.splitGroups.create(API_URL, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["splitGroups"] });
            queryClient.invalidateQueries({ queryKey: ["wallets"] });
        }
    });

    return {
        createGroup: createMutation.mutateAsync,
        isLoading: createMutation.isPending,
        error: createMutation.error
    };
}
