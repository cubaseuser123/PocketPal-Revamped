import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "./useUser";
import { api } from "@repo/auth";

// ─── Types ─────────────────────────────────────────────────────────

export interface DuelUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  coins: number;
  level: number;
}

export interface Duel {
  id: string;
  challengerId: string;
  challengedId: string;
  challenger: DuelUser;
  challenged: DuelUser;
  type: "most_saved" | "fewest_expenses" | "no_spend_streak";
  wager: number;
  startDate: string | null;
  endDate: string | null;
  winnerId: string | null;
  winner?: { id: string; name: string } | null;
  status: "pending" | "active" | "completed" | "expired" | "declined";
  challengerProgress: number;
  challengedProgress: number;
  createdAt: string;
}

export interface DuelRecord {
  wins: number;
  losses: number;
  draws: number;
  total: number;
}

// ─── Hook ──────────────────────────────────────────────────────────

export function useDuels() {
  const queryClient = useQueryClient();

  // Active & pending duels
  const {
    data: duelsData,
    isLoading: duelsLoading,
    refetch: refetchDuels,
  } = useQuery({
    queryKey: ["duels"],
    queryFn: async () => {
      const res = await api.get(`${API_URL}/api/v1/duels`);
      return res.data as { duels: Duel[] };
    },
    staleTime: 1000 * 30,
  });

  // Duel history
  const {
    data: historyData,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["duels", "history"],
    queryFn: async () => {
      const res = await api.get(`${API_URL}/api/v1/duels/history`);
      return res.data as { history: Duel[]; record: DuelRecord };
    },
    staleTime: 1000 * 60,
  });

  // Create duel
  const createDuelMutation = useMutation({
    mutationFn: async (data: {
      challengedId: string;
      type: Duel["type"];
      wager: number;
    }) => {
      const res = await api.post(`${API_URL}/api/v1/duels`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duels"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  // Respond to duel
  const respondMutation = useMutation({
    mutationFn: async ({ duelId, action }: { duelId: string; action: "accept" | "decline" }) => {
      const res = await api.post(`${API_URL}/api/v1/duels/${duelId}/respond`, { action });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duels"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const createDuel = useCallback(
    async (data: { challengedId: string; type: Duel["type"]; wager: number }) => {
      return await createDuelMutation.mutateAsync(data);
    },
    [createDuelMutation]
  );

  const respondToDuel = useCallback(
    async (duelId: string, action: "accept" | "decline") => {
      return await respondMutation.mutateAsync({ duelId, action });
    },
    [respondMutation]
  );

  return {
    duels: duelsData?.duels || [],
    duelsLoading,
    history: historyData?.history || [],
    record: historyData?.record || { wins: 0, losses: 0, draws: 0, total: 0 },
    historyLoading,
    createDuel,
    respondToDuel,
    creating: createDuelMutation.isPending,
    responding: respondMutation.isPending,
    refetchDuels,
    refetchHistory,
  };
}
