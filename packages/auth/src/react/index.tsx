// Re-export everything from base package
export * from "../index";

// Export React-specific utilities
export { AuthProvider, useAuth } from "./AuthContext";
export type { AuthProviderProps } from "./AuthContext";
export { useLogin, useRegister } from "./hooks";
