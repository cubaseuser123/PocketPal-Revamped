import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabBar } from "../../components/ui/TabBar";
import { PallyBottomSheet } from "../../components/pally/PallyBottomSheet";
import { usePally } from "../../contexts/PallyContext";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { isPallyOpen, closePally } = usePally();

  return (
    <View className="flex-1 bg-background-dark">
      <StatusBar style="light" />
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 88 + insets.bottom,
            paddingBottom: insets.bottom,
          },
          // Smooth slide animation between tabs
          animation: "shift",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
          }}
        />
        <Tabs.Screen
          name="pally"
          options={{
            title: "Pally",
          }}
          listeners={{
            tabPress: (e) => {
              // Prevent default navigation - Pally opens as a sheet
              // The TabBar component will handle opening the sheet
            },
          }}
        />
        <Tabs.Screen
          name="arcade"
          options={{
            title: "Arcade",
          }}
        />
        <Tabs.Screen
          name="goals"
          options={{
            title: "Goals",
          }}
        />
        <Tabs.Screen
          name="wallets"
          options={{
            title: "Wallets",
          }}
        />
      </Tabs>

      {/* Pally Bottom Sheet */}
      <PallyBottomSheet isOpen={isPallyOpen} onClose={closePally} />
    </View>
  );
}
