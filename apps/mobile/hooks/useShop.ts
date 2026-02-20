import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "./useUser";
import { api } from "@repo/auth";

// ─── Types ─────────────────────────────────────────────────────────

export interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  category: string;
  price: number;
  isActive: boolean;
  metadata: string | null;
  owned: boolean;
}

export interface Purchase {
  id: string;
  item: ShopItem;
  price: number;
  purchasedAt: string;
}

// ─── Hook ──────────────────────────────────────────────────────────

export function useShop() {
  const queryClient = useQueryClient();

  // Shop items grouped by category
  const {
    data: shopData,
    isLoading: shopLoading,
    refetch: refetchShop,
  } = useQuery({
    queryKey: ["shop"],
    queryFn: async () => {
      const res = await api.get(`${API_URL}/api/v1/shop`);
      return res.data as {
        categories: Record<string, ShopItem[]>;
        totalItems: number;
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // My purchases
  const {
    data: purchasesData,
    isLoading: purchasesLoading,
    refetch: refetchPurchases,
  } = useQuery({
    queryKey: ["shop", "purchases"],
    queryFn: async () => {
      const res = await api.get(`${API_URL}/api/v1/shop/purchases`);
      return res.data as { purchases: Purchase[]; totalSpent: number };
    },
    staleTime: 1000 * 60,
  });

  // Purchase item
  const purchaseMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await api.post(`${API_URL}/api/v1/shop/purchase/${itemId}`, {});
      return res.data as { message: string; remainingCoins: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop"] });
      queryClient.invalidateQueries({ queryKey: ["shop", "purchases"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["wheel"] }); // For bonus spin
    },
  });

  const purchaseItem = useCallback(
    async (itemId: string) => {
      return await purchaseMutation.mutateAsync(itemId);
    },
    [purchaseMutation]
  );

  return {
    categories: shopData?.categories || {},
    shopLoading,
    purchases: purchasesData?.purchases || [],
    totalSpent: purchasesData?.totalSpent || 0,
    purchasesLoading,
    purchaseItem,
    purchasing: purchaseMutation.isPending,
    refetchShop,
    refetchPurchases,
  };
}
