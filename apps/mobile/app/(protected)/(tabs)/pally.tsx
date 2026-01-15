import { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";

// This screen is not directly used - Pally opens as a bottom sheet
// This exists to satisfy the tab navigation structure
export default function PallyScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home if someone navigates here directly
    router.replace("/(protected)/(tabs)");
  }, []);

  return <View className="flex-1 bg-background-dark" />;
}
