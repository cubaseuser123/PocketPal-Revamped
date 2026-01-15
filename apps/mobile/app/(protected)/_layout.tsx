import { Stack } from "expo-router";
import { PallyProvider } from "../../contexts/PallyContext";

export default function ProtectedLayout() {
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
      </Stack>
    </PallyProvider>
  );
}
