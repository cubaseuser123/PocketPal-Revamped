import { useEffect, useState } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuth, storage, userApi } from "@repo/auth";
import { API_URL } from "./useApi";



export function useAuthNavigation() {
  const authContext = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      setCheckingOnboarding(true);
      try {
        if (authContext?.authenticated) {
          const token = await storage.get("access_token");
          if (token) {
            try {
              const data = await userApi.getProfile(API_URL);
              if (data && data.user) {
                const backendOnboarding = data.user.onboardingCompleted === true;
                setOnboardingComplete(backendOnboarding);
                setCheckingOnboarding(false);
                return;
              }
            } catch (e) {
              console.log("Could not check backend onboarding status:", e);
            }
          }
        }
        setOnboardingComplete(false);
      } catch (e) {
        console.error("Error checking onboarding:", e);
        setOnboardingComplete(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };
    
    // Re-check when auth status changes
    if (!authContext?.loading) {
      checkOnboarding();
    }
  }, [authContext?.authenticated, authContext?.loading]);

  useEffect(() => {
    // Wait for both auth loading and onboarding check
    if (authContext?.loading || checkingOnboarding) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inProtectedGroup = segments[0] === "(protected)";
    
    // Check which auth screen the user is on
    const currentScreen = segments[1];
    const isOnOnboardingFlow = ["onboarding", "how-it-works", "wallet-explanation", 
      "kyc-explanation", "kyc-steps", "kyc-pan", "kyc-details", "kyc-selfie",
      "add-money", "add-money-limited", "payment-method", "onboarding-success"].includes(currentScreen as string);

    if (authContext?.authenticated) {
      if (inAuthGroup) {
        if (onboardingComplete) {
          // User is authenticated AND has completed onboarding - go to protected
          router.replace("/(protected)/(tabs)");
        }
        // If not onboarding complete, let them stay on auth screens (onboarding flow)
      }
    } else {
      // User is not authenticated
      if (inProtectedGroup) {
        // Redirect to welcome if trying to access protected
        router.replace("/(auth)/welcome");
      } else if (!inAuthGroup) {
        // Redirect to welcome if not in any group
        router.replace("/(auth)/welcome");
      } else if (isOnOnboardingFlow) {
        // User is not authenticated but on onboarding flow - redirect to login
        router.replace("/(auth)/welcome");
      }
    }
  }, [authContext?.authenticated, authContext?.loading, segments, onboardingComplete, checkingOnboarding]);

  return { 
    isLoading: authContext?.loading || checkingOnboarding 
  };
}
