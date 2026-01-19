import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "./useUser";

// --- GAMIFICATION (BOSS & QUESTS & WHEEL) ---

export interface BossBattle {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  emoji: string;
  sidekickEmoji?: string;
  totalHealth: number;
  currentHealth: number;
  rewards: { coins: number; xp: number };
  status: "active" | "defeated" | "upcoming";
  leaderboard: Array<{
    userId: { id: string; name: string; avatarUrl: string | null };
    damage: number;
  }>;
}

export function useBoss() {
  const queryClient = useQueryClient();

  const {
    data: boss,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["boss"],
    queryFn: async () => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/v1/boss/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return (await res.json()) as BossBattle;
    },
    staleTime: 5 * 60 * 1000,
  });

  const dealDamageMutation = useMutation({
    mutationFn: async ({
      bossId,
      amount,
    }: {
      bossId: string;
      amount: number;
    }) => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/v1/boss/${bossId}/damage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boss"] });
    },
  });

  const dealDamage = useCallback(
    async (bossId: string, amount: number) => {
      return await dealDamageMutation.mutateAsync({ bossId, amount });
    },
    [dealDamageMutation],
  );

  return {
    boss,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
    dealDamage,
  };
}

export interface Quest {
  id: string;
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

  const {
    data: quests,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["quests"],
    queryFn: async () => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/v1/quests/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Check if response is ok
      if (!res.ok) {
        throw new Error("Failed to fetch quests");
      }
      return (await res.json()) as Quest[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const assignQuestsMutation = useMutation({
    mutationFn: async () => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/v1/quests/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

  return {
    quests: quests || [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
    assignQuests,
  };
}

export interface WheelStatus {
  canSpin: boolean;
  lastSpinDate: string | null;
  segments: Array<{ id: number; label: string; reward: number; color: string }>;
}

export function useWheel() {
  const queryClient = useQueryClient();

  const {
    data: wheelStatus,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["wheel"],
    queryFn: async () => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/v1/wheel/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (await res.json()) as WheelStatus;
    },
  });

  const spinMutation = useMutation({
    mutationFn: async () => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/v1/wheel/spin`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wheel"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const spin = useCallback(async () => {
    return await spinMutation.mutateAsync();
  }, [spinMutation]);

  return {
    wheelStatus,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
    spin,
  };
}

// --- SOCIAL ---

export interface Friend {
  friendshipId: string;
  id: string;
  name: string;
  avatarUrl: string | null;
  level: number;
  coins: number;
  totalGoalsCompleted: number;
}

export interface FriendRequest {
  id: string;
  from: {
    id: string;
    name: string;
    avatarUrl: string | null;
    level: number;
  };
  createdAt: string;
}

export function useFriends() {
  const queryClient = useQueryClient();

  const {
    data: friendsData,
    isLoading: friendsLoading,
    refetch: refetchFriends,
  } = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/v1/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (await res.json()) as { friends: Friend[] };
    },
  });

  const {
    data: pendingData,
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: async () => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/v1/friends/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (await res.json()) as { requests: FriendRequest[] };
    },
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (friendCode: string) => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/v1/friends/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send request");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/v1/friends/accept/${requestId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to accept");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/v1/friends/reject/${requestId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reject");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/v1/friends/${friendshipId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to remove");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const sendRequest = useCallback(
    async (friendCode: string) => {
      return await sendRequestMutation.mutateAsync(friendCode);
    },
    [sendRequestMutation],
  );

  const acceptRequest = useCallback(
    async (requestId: string) => {
      return await acceptRequestMutation.mutateAsync(requestId);
    },
    [acceptRequestMutation],
  );

  const rejectRequest = useCallback(
    async (requestId: string) => {
      return await rejectRequestMutation.mutateAsync(requestId);
    },
    [rejectRequestMutation],
  );

  const removeFriend = useCallback(
    async (friendshipId: string) => {
      return await removeFriendMutation.mutateAsync(friendshipId);
    },
    [removeFriendMutation],
  );

  return {
    friends: friendsData?.friends || [],
    pendingRequests: pendingData?.requests || [],
    loading: friendsLoading || pendingLoading,
    refetchFriends,
    refetchPending,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
  };
}

// --- BADGES ETC ---
export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
  earned: boolean;
  earnedAt: string | null;
}

export function useBadges() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/v1/badges/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (await res.json()) as {
        badges: Badge[];
        earnedCount: number;
        totalCount: number;
      };
    },
  });

  const safeBadges = data?.badges || [];
  const earnedCount = data?.earnedCount || 0;
  const totalCount = data?.totalCount || 0;

  return {
    badges: safeBadges,
    earnedCount,
    totalCount,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatarUrl: string | null;
  level: number;
  coins: number;
  totalGoalsCompleted: number;
  isCurrentUser: boolean;
}

export function useLeaderboard(type: "coins" | "goals" = "coins") {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["leaderboard", type],
    queryFn: async () => {
      const { auth } = await import("@repo/auth");
      const token = await auth.getToken();
      const res = await fetch(`${API_URL}/api/v1/friends/leaderboard/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (await res.json()) as {
        leaderboard: LeaderboardEntry[];
        type: string;
      };
    },
  });

  return {
    leaderboard: data?.leaderboard || [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
