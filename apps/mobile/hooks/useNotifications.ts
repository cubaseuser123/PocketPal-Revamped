import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "./useUser";
import { storage } from "@repo/auth";

interface Notification {
  id: string;
  userId: string;
  type: "alert" | "insight" | "celebration" | "reminder";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const token = await storage.get("access_token");
      if (!token) throw new Error("No access token");
      
      const response = await fetch(`${API_URL}/api/v1/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch notifications");
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const token = await storage.get("access_token");
      if (!token) throw new Error("No access token");
      
      const response = await fetch(
        `${API_URL}/api/v1/notifications/${notificationId}/read`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to mark as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const token = await storage.get("access_token");
      if (!token) throw new Error("No access token");
      
      const response = await fetch(
        `${API_URL}/api/v1/notifications/read-all`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to mark all as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    error,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
}
