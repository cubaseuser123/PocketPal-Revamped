import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { AuthProvider, useAuth, storage } from "@repo/auth";
import "./globals.css";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const ONBOARDING_COMPLETE_KEY = "onboarding_complete";

function RootLayoutNav() {
  const authContext = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Check onboarding status - from backend user profile if authenticated, otherwise local storage
  useEffect(() => {
    const checkOnboarding = async () => {
      setCheckingOnboarding(true);
      try {
        // First check local storage
        const localValue = await storage.get(ONBOARDING_COMPLETE_KEY);
        if (localValue === "true") {
          setOnboardingComplete(true);
          setCheckingOnboarding(false);
          return;
        }

         if (authContext?.authenticated) {
          const token = await storage.get("access_token");
          if (token) {
            try {
              const { API_URL } = await import("../hooks/useApi");
              const response = await fetch(`${API_URL}/api/user/me`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              if (response.ok) {
                const data = await response.json();
                const backendOnboarding = data.user?.onboardingCompleted === true;
                
                // Sync local storage with backend
                if (backendOnboarding) {
                  await storage.set(ONBOARDING_COMPLETE_KEY, "true");
                }
                
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
      } catch {
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

  if (authContext?.loading || checkingOnboarding) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0F14", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#FF8C32" />
      </View>
    );
  }

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: "#0F0F14" },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(protected)" options={{ headerShown: false }} />
    </Stack>
  );
}

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onlineManager } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import { OfflineNotice } from "../components/OfflineNotice";
import { CustomAlertProvider } from "../contexts/CustomAlertContext";

// Sync online status with NetInfo
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Data remains fresh indefinitely by default
      retry: 2,
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  },
});

// Create persister
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "POCKETPAL_QUERY_CACHE",
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0F0F14" }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
        <SafeAreaProvider>
          <CustomAlertProvider>
            <AuthProvider>
              <BottomSheetModalProvider>
                <RootLayoutNav />
                <OfflineNotice />
              </BottomSheetModalProvider>
            </AuthProvider>
          </CustomAlertProvider>
        </SafeAreaProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
