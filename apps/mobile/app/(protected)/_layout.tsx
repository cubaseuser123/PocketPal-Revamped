import { useEffect } from "react";
import { Stack } from "expo-router";
import { PallyProvider } from "../../contexts/PallyContext";
import { registerForPushNotifications } from "../../services/pushSetup";

export default function ProtectedLayout() {
  // Register for push notifications when user enters protected area
  useEffect(() => {
    registerForPushNotifications().then((token) => {
      if (token) {
        console.log("[Push] Registered with token:", token.substring(0, 30) + "...");
      }
    });
  }, []);

  return (
    <PallyProvider>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: "#0F0F14" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="boss-battle" options={{ headerShown: false }} />
        <Stack.Screen name="streak-arena" options={{ headerShown: false }} />
        <Stack.Screen name="savings-wheel" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="duels" options={{ headerShown: false }} />
        <Stack.Screen name="shop" options={{ headerShown: false }} />
      </Stack>
    </PallyProvider>
  );
}
