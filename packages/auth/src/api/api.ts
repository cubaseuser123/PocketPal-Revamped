import { api as httpApi } from "./http";

/**
 * API service for PocketPal backend
 * Auth tokens are automatically included by the http module
 */

// User API
export const userApi = {
  getProfile: async (baseUrl: string) => {
    const response = await httpApi.get(`${baseUrl}/api/user/me`);
    return response.data;
  },

  updateProfile: async (baseUrl: string, data: { name?: string; avatarUrl?: string }) => {
    const response = await httpApi.put(`${baseUrl}/api/user/me`, data);
    return response.data;
  },

  completeOnboarding: async (baseUrl: string) => {
    const response = await httpApi.post(`${baseUrl}/api/user/complete-onboarding`, {});
    return response.data;
  },

  completeKyc: async (baseUrl: string) => {
    const response = await httpApi.post(`${baseUrl}/api/user/complete-kyc`, {});
    return response.data;
  },
};

// Wallet API
export const walletApi = {
  get: async (baseUrl: string) => {
    const response = await httpApi.get(`${baseUrl}/api/wallets`);
    return response.data;
  },

  addMoney: async (baseUrl: string, amount: number) => {
    const response = await httpApi.post(`${baseUrl}/api/wallets/add-money`, { amount });
    return response.data;
  },

  transfer: async (baseUrl: string, from: string, to: string, amount: number, sourceGoalId?: string) => {
    const response = await httpApi.post(`${baseUrl}/api/wallets/transfer`, { from, to, amount, sourceGoalId });
    return response.data;
  },

  upgradePpi: async (baseUrl: string) => {
    const response = await httpApi.post(`${baseUrl}/api/wallets/upgrade-ppi`, {});
    return response.data;
  },
};

// Transaction API
export const transactionApi = {
  list: async (baseUrl: string, params?: { limit?: number; offset?: number; walletType?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.walletType) queryParams.append("walletType", params.walletType);
    
    const url = `${baseUrl}/api/transactions${queryParams.toString() ? `?${queryParams}` : ""}`;
    const response = await httpApi.get(url);
    return response.data;
  },

  create: async (baseUrl: string, data: {
    name: string;
    emoji?: string;
    amount: number;
    categoryId?: string;
    walletType?: string;
  }) => {
    const response = await httpApi.post(`${baseUrl}/api/transactions`, data);
    return response.data;
  },

  summary: async (baseUrl: string, period: "week" | "month" | "3m" = "week") => {
    const response = await httpApi.get(`${baseUrl}/api/transactions/summary?period=${period}`);
    return response.data;
  },
};

// Goal API
export const goalApi = {
  list: async (baseUrl: string) => {
    const response = await httpApi.get(`${baseUrl}/api/goals`);
    return response.data;
  },

  create: async (baseUrl: string, data: {
    name: string;
    emoji?: string;
    category?: string;
    color?: string;
    targetAmount: number;
    isFeatured?: boolean;
  }) => {
    const response = await httpApi.post(`${baseUrl}/api/goals`, data);
    return response.data;
  },

  update: async (baseUrl: string, id: string, data: Partial<{
    name: string;
    emoji: string;
    category: string;
    color: string;
    targetAmount: number;
    isFeatured: boolean;
  }>) => {
    const response = await httpApi.put(`${baseUrl}/api/goals/${id}`, data);
    return response.data;
  },

  addToGoal: async (baseUrl: string, id: string, amount: number) => {
    const response = await httpApi.post(`${baseUrl}/api/goals/${id}/add`, { amount });
    return response.data;
  },

  delete: async (baseUrl: string, id: string) => {
    const response = await httpApi.delete(`${baseUrl}/api/goals/${id}`);
    return response.data;
  },
};

// Category API
export const categoryApi = {
  list: async (baseUrl: string) => {
    const response = await httpApi.get(`${baseUrl}/api/categories`);
    return response.data;
  },
};

// Subscription API
export const subscriptionApi = {
  add: async (baseUrl: string, data: {
    name: string;
    price: number;
    category?: string;
    startDate: string;
    renewalCycle?: string;
  }) => {
    const response = await httpApi.post(`${baseUrl}/api/subscriptions/add`, data);
    return response.data;
  },

  getAll: async (baseUrl: string) => {
    const response = await httpApi.get(`${baseUrl}/api/subscriptions`);
    return response.data;
  },

  getActive: async (baseUrl: string) => {
    const response = await httpApi.get(`${baseUrl}/api/subscriptions/active`);
    return response.data;
  },

  getUpcoming: async (baseUrl: string) => {
    const response = await httpApi.get(`${baseUrl}/api/subscriptions/upcoming`);
    return response.data;
  },

  getCancelled: async (baseUrl: string) => {
    const response = await httpApi.get(`${baseUrl}/api/subscriptions/cancelled`);
    return response.data;
  },

  cancel: async (baseUrl: string, id: string) => {
    const response = await httpApi.put(`${baseUrl}/api/subscriptions/cancel/${id}`, {});
    return response.data;
  },
};

// Export all APIs
export const pocketPalApi = {
  user: userApi,
  wallets: walletApi,
  transactions: transactionApi,
  goals: goalApi,
  categories: categoryApi,
  subscriptions: subscriptionApi,
};
