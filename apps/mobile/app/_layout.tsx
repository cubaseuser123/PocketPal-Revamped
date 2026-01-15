import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
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

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await storage.get(ONBOARDING_COMPLETE_KEY);
        setOnboardingComplete(value === "true");
      } catch {
        setOnboardingComplete(false);
      }
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    // Wait for both auth loading and onboarding check
    if (authContext?.loading || onboardingComplete === null) return;

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
  }, [authContext?.authenticated, authContext?.loading, segments, onboardingComplete]);

  if (authContext?.loading || onboardingComplete === null) {
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
      <SafeAreaProvider>
        <AuthProvider>
          <BottomSheetModalProvider>
            <RootLayoutNav />
          </BottomSheetModalProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
