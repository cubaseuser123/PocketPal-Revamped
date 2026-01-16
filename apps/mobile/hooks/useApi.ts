// Re-export everything from new hooks for backward compatibility
// Ideally, we should migrate all imports to point to the new files directly.

export * from "./useUser";
export * from "./useWallet";
export * from "./useGoal";
export * from "./useGamification";

// Export API URL for direct use
export { API_URL } from "./useUser";


