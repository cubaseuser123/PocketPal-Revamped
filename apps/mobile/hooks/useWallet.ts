import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { walletApi, transactionApi } from "@repo/auth";
import { API_URL } from "./useUser";

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
  id: string;
  name: string;
  emoji: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  createdAt: string;
  groupId?: string;
  note?: string;
  categoryId?: { id: string; name: string; emoji: string; color: string };
}

export function useWallets() {
  const queryClient = useQueryClient();

  const {
    data: wallets,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["wallets"],
    queryFn: async () => {
      const data = await walletApi.get(API_URL);
      return data as WalletData;
    },
    staleTime: 1000 * 30, // 30 seconds
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
    mutationFn: async ({
      from,
      to,
      amount,
      sourceGoalId,
    }: {
      from: string;
      to: string;
      amount: number;
      sourceGoalId?: string;
    }) => {
      // @ts-ignore
      return await walletApi.transfer(API_URL, from, to, amount, sourceGoalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["spendingSummary"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const addMoney = useCallback(
    async (amount: number) => {
      return await addMoneyMutation.mutateAsync(amount);
    },
    [addMoneyMutation],
  );

  const transfer = useCallback(
    async (from: string, to: string, amount: number, sourceGoalId?: string) => {
      return await transferMutation.mutateAsync({
        from,
        to,
        amount,
        sourceGoalId,
      });
    },
    [transferMutation],
  );

  return {
    wallets,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
    addMoney,
    transfer,
  };
}

export function useTransactions(walletType?: string) {
  const queryClient = useQueryClient();
  const {
    data: transactions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["transactions", { walletType }],
    queryFn: async () => {
      const data = await transactionApi.list(API_URL, {
        walletType,
        limit: 20,
      });
      return data.transactions as Transaction[];
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  const addTransactionMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      amount: number;
      categoryId?: string;
      walletType?: string;
      emoji?: string;
    }) => {
      return await transactionApi.create(API_URL, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["spendingSummary"] });
    },
  });

  const addTransaction = useCallback(
    async (
      name: string,
      amount: number,
      categoryId?: string,
      walletType: string = "primary",
      emoji?: string,
    ) => {
      return await addTransactionMutation.mutateAsync({
        name,
        amount,
        categoryId,
        walletType,
        emoji,
      });
    },
    [addTransactionMutation],
  );

  return {
    transactions: transactions || [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
    addTransaction,
  };
}

export function useSpendingSummary(period: "week" | "month" | "3m" = "week") {
  const {
    data: summary,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["spendingSummary", period],
    queryFn: async () => {
      const data = await transactionApi.summary(API_URL, period);
      return data as { totalSpent: number; avgPerDay: number };
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    summary,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
