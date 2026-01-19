import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { AuthProvider } from "@repo/auth";
import "./globals.css";
import { useAuthNavigation } from "../hooks/useAuthNavigation";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isLoading } = useAuthNavigation();

  if (isLoading) {
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
      staleTime: 0, // Always consider data stale (refetch on mount/focus)
      retry: 2,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (keep cache for offline usage)
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

  const handleLogout = async () => {
    console.log("[App] Clearing query cache on logout");
    queryClient.removeQueries();
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0F0F14" }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
        <SafeAreaProvider>
          <CustomAlertProvider>
            <AuthProvider onLogout={handleLogout}>
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
