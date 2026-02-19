
import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, storage, api } from "@repo/auth";

// Get API base URL based on platform
const getApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return "http://localhost:5757";
};

// Get Auth server URL (Better Auth)
// When using ngrok, auth is proxied through the backend
// Note: The @repo/auth package appends /api/auth/* to this URL
const getAuthUrl = (): string => {
  if (process.env.EXPO_PUBLIC_AUTH_URL) {
    return process.env.EXPO_PUBLIC_AUTH_URL;
  }
  // Fallback: use same base URL as API (proxy handles forwarding to auth server)
  // This allows single ngrok tunnel for both backend + auth
  return getApiUrl();
};

export const API_URL = getApiUrl();
export const AUTH_URL = getAuthUrl();

export interface User {
  id: string;
  name: string;
  phone: string;
  level: number;
  coins: number;
  avatarUrl: string | null;
  kycCompleted: boolean;
  onboardingCompleted: boolean;
  friendCode?: string;
  totalGoalsCompleted?: number;
}

export const getFullAvatarUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

export function useUser() {
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const data = await userApi.getProfile(API_URL);
      return data.user as User;
    },
    staleTime: 1000 * 30, // 30 seconds
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

  const uploadAvatarMutation = useMutation({
    mutationFn: async (uri: string) => {
      const token = await storage.get("access_token");
      if (!token) throw new Error("No access token");

      const formData = new FormData();
      // @ts-ignore
      formData.append('image', {
        uri,
        name: `profile-${Date.now()}.jpg`,
        type: 'image/jpeg',
      });

      const response = await fetch(`${API_URL}/api/v1/user/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const uploadAvatar = useCallback(async (uri: string) => {
    return await uploadAvatarMutation.mutateAsync(uri);
  }, [uploadAvatarMutation]);

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      // Use generic api wrapper directly to avoid needing to rebuild auth package
      // wrapper handles token retrieval automatically
      return await api.delete(`${API_URL}/api/v1/user/me`);
    },
    onSuccess: () => {
        // No need to invalidate queries as user is deleted, logout should happen in component
    }
  });

  const deleteAccount = useCallback(async () => {
    return await deleteAccountMutation.mutateAsync();
  }, [deleteAccountMutation]);

  const completeKycMutation = useMutation({
    mutationFn: async () => {
      // Simulation of KYC process
      return await api.post(`${API_URL}/api/v1/user/complete-kyc`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const completeKyc = useCallback(async () => {
    return await completeKycMutation.mutateAsync();
  }, [completeKycMutation]);

  return { user, loading: isLoading, error: error ? (error as Error).message : null, refetch, updateUser, uploadAvatar, deleteAccount, completeKyc };
}
