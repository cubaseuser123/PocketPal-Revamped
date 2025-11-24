// Export types
export type {
  User,
  RegisterData,
  LoginData,
  AuthResponse,
  ErrorResponse,
  AuthState,
} from "./types";

// Export config
export { AUTH_CONFIG, getApiUrl, getTokenKey } from "./config";

// Export storage
export { storage } from "./storage";

// Export client
export { authClient, default } from "./client";
