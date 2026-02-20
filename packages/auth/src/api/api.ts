import { api as httpApi } from "./http";

/**
 * API service for PocketPal backend
 * Auth tokens are automatically included by the http module
 */

// User API
export const userApi = {
  getProfile: async (baseUrl: string) => {
    const response = await httpApi.get(`${baseUrl}/api/v1/user/me`);
    return response.data;
  },

  getDashboard: async (baseUrl: string) => {
    const response = await httpApi.get(`${baseUrl}/api/v1/user/dashboard`);
    return response.data;
  },

  updateProfile: async (baseUrl: string, data: { name?: string; avatarUrl?: string }) => {
    const response = await httpApi.put(`${baseUrl}/api/v1/user/me`, data);
    return response.data;
  },

  completeOnboarding: async (baseUrl: string, amount?: string) => {
    const response = await httpApi.post(`${baseUrl}/api/v1/user/complete-onboarding`, { amount });
    return response.data;
  },

  completeKyc: async (baseUrl: string) => {
    const response = await httpApi.post(`${baseUrl}/api/v1/user/complete-kyc`, {});
    return response.data;
  },

  deleteAccount: async (baseUrl: string) => {
    const response = await httpApi.delete(`${baseUrl}/api/v1/user/me`);
    return response.data;
  },

  checkExists: async (baseUrl: string, phone: string) => {
    const response = await httpApi.post(`${baseUrl}/api/v1/user/check-exists`, { phone });
    return response.data;
  },
};

// Wallet API
export const walletApi = {
  get: async (baseUrl: string) => {
    const response = await httpApi.get(`${baseUrl}/api/v1/wallets`);
    return response.data;
  },

  addMoney: async (baseUrl: string, amount: number) => {
    const response = await httpApi.post(`${baseUrl}/api/v1/wallets/add-money`, { amount });
    return response.data;
  },

  transfer: async (baseUrl: string, from: string, to: string, amount: number, sourceGoalId?: string) => {
    const response = await httpApi.post(`${baseUrl}/api/v1/wallets/transfer`, { from, to, amount, sourceGoalId });
    return response.data;
  },

  upgradePpi: async (baseUrl: string) => {
    const response = await httpApi.post(`${baseUrl}/api/v1/wallets/upgrade-ppi`, {});
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
    
    const url = `${baseUrl}/api/v1/transactions${queryParams.toString() ? `?${queryParams}` : ""}`;
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
    const response = await httpApi.post(`${baseUrl}/api/v1/transactions`, data);
    return response.data;
  },

  summary: async (baseUrl: string, period: "week" | "month" | "3m" = "week") => {
    const response = await httpApi.get(`${baseUrl}/api/v1/transactions/summary?period=${period}`);
    return response.data;
  },
};

// Goal API
export const goalApi = {
  list: async (baseUrl: string) => {
    const response = await httpApi.get(`${baseUrl}/api/v1/goals`);
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
    const response = await httpApi.post(`${baseUrl}/api/v1/goals`, data);
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
    const response = await httpApi.put(`${baseUrl}/api/v1/goals/${id}`, data);
    return response.data;
  },

  addToGoal: async (baseUrl: string, id: string, amount: number) => {
    const response = await httpApi.post(`${baseUrl}/api/v1/goals/${id}/add`, { amount });
    return response.data;
  },

  delete: async (baseUrl: string, id: string) => {
    const response = await httpApi.delete(`${baseUrl}/api/v1/goals/${id}`);
    return response.data;
  },
};

// Category API
export const categoryApi = {
  list: async (baseUrl: string) => {
    const response = await httpApi.get(`${baseUrl}/api/v1/categories`);
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
    const response = await httpApi.post(`${baseUrl}/api/v1/subscriptions/add`, data);
    return response.data;
  },

  getAll: async (baseUrl: string) => {
    const response = await httpApi.get(`${baseUrl}/api/v1/subscriptions`);
    return response.data;
  },

  getActive: async (baseUrl: string) => {
    const response = await httpApi.get(`${baseUrl}/api/v1/subscriptions/active`);
    return response.data;
  },

  getUpcoming: async (baseUrl: string) => {
    const response = await httpApi.get(`${baseUrl}/api/v1/subscriptions/upcoming`);
    return response.data;
  },

  getCancelled: async (baseUrl: string) => {
    const response = await httpApi.get(`${baseUrl}/api/v1/subscriptions/cancelled`);
    return response.data;
  },

  cancel: async (baseUrl: string, id: string) => {
    const response = await httpApi.put(`${baseUrl}/api/v1/subscriptions/cancel/${id}`, {});
    return response.data;
  },
};

// Friend API
export const friendApi = {
  list: async (baseUrl: string) => {
    const response = await httpApi.get(`${baseUrl}/api/v1/friends`);
    return response.data;
  },
};

// Split Group API
export const splitGroupApi = {
  create: async (baseUrl: string, data: { name: string; totalAmount: number; members: string[] }) => {
    const response = await httpApi.post(`${baseUrl}/api/v1/split-groups`, data);
    return response.data;
  },

  list: async (baseUrl: string) => {
    const response = await httpApi.get(`${baseUrl}/api/v1/split-groups`);
    return response.data;
  },

  getDetails: async (baseUrl: string, id: string) => {
    const response = await httpApi.get(`${baseUrl}/api/v1/split-groups/${id}`);
    return response.data;
  },

  pay: async (baseUrl: string, id: string, amount: number) => {
    const response = await httpApi.post(`${baseUrl}/api/v1/split-groups/${id}/pay`, { amount });
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
  splitGroups: splitGroupApi,
  friends: friendApi,
};
