import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "#0F0F14" },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="how-it-works" />
      <Stack.Screen name="wallet-explanation" />
      <Stack.Screen name="kyc-explanation" />
      <Stack.Screen name="kyc-steps" />
      <Stack.Screen name="kyc-pan" />
      <Stack.Screen name="kyc-details" />
      <Stack.Screen name="kyc-selfie" />
    </Stack>
  );
}
