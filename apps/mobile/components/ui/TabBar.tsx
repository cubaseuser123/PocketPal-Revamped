import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { usePally } from "../../contexts/PallyContext";

type TabRoute = "index" | "pally" | "arcade" | "goals" | "wallets";

const TAB_CONFIG: Record<
  TabRoute,
  { label: string; icon?: keyof typeof MaterialIcons.glyphMap; emoji?: string }
> = {
  index: { label: "Home", icon: "home" },
  pally: { label: "Pally", emoji: "🐿️" },
  arcade: { label: "Arcade", icon: "sports-esports" },
  goals: { label: "Goals", icon: "flag" },
  wallets: { label: "Wallets", icon: "account-balance-wallet" },
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { openPally, isPallyOpen } = usePally();

  const outerTabs = state.routes.filter(
    (r) => r.name === "index" || r.name === "wallets"
  );
  const centerTabs = state.routes.filter(
    (r) => r.name === "pally" || r.name === "arcade" || r.name === "goals"
  );

  const renderTab = (
    route: (typeof state.routes)[0],
    index: number,
    isCenter: boolean = false,
    isArcade: boolean = false
  ) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === state.routes.indexOf(route);
    const config = TAB_CONFIG[route.name as TabRoute];

    const onPress = () => {
      // Special handling for Pally - open bottom sheet instead of navigating
      if (route.name === "pally") {
        openPally();
        return;
      }

      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    if (isArcade) {
      return (
        <TouchableOpacity
          key={route.key}
          onPress={onPress}
          activeOpacity={0.8}
          className="items-center justify-center -mt-6"
        >
          <View
            className="h-14 w-14 rounded-full bg-card-dark border-2 items-center justify-center"
            style={[
              styles.arcadeButton,
              isFocused && styles.arcadeButtonFocused,
            ]}
          >
            <View className="absolute inset-1 rounded-full bg-primary/10" />
            <MaterialIcons
              name="sports-esports"
              size={28}
              color="#FF8C32"
              style={styles.arcadeIcon}
            />
          </View>
          <Text
            className={`text-[9px] font-bold mt-1 ${isFocused ? "text-primary" : "text-white"}`}
          >
            {config.label}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        activeOpacity={0.7}
        className={`items-center justify-center ${isCenter ? "pb-1" : ""}`}
        style={isCenter ? {} : { opacity: isFocused ? 1 : 0.6 }}
      >
        {config.emoji ? (
          <Text
            className="text-xl"
            style={{ opacity: isFocused ? 1 : 0.7 }}
          >
            {config.emoji}
          </Text>
        ) : (
          <View
            className={`p-1 rounded-lg ${isFocused && !isCenter ? "bg-primary/10" : ""}`}
            style={isFocused && !isCenter ? { borderRadius: 8 } : undefined}
          >
            <MaterialIcons
              name={config.icon!}
              size={24}
              color={isFocused ? "#FF8C32" : "#B0B0C3"}
            />
          </View>
        )}
        <Text
          className={`text-[10px] font-medium mt-0.5 ${
            isFocused
              ? isCenter
                ? "text-white"
                : "text-primary"
              : isCenter
                ? "text-white"
                : "text-text-secondary"
          }`}
        >
          {config.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Glass background */}
      <View style={styles.glassBackground} className="bg-card-dark/90 border-t border-white/5" />

      {/* Tab content */}
      <View style={styles.tabContent}>
        {/* Left tab (Home) */}
        <View className="flex-1 items-end pr-6">
          {outerTabs.find((r) => r.name === "index") &&
            renderTab(
              outerTabs.find((r) => r.name === "index")!,
              0,
              false,
              false
            )}
        </View>

        {/* Center floating group (Pally, Arcade, Goals) */}
        <View
          className="bg-card-dark border border-white/10 rounded-3xl px-5 py-2 flex-row items-end gap-6 -mt-3"
          style={styles.centerGroup}
        >
          {centerTabs.map((route, idx) =>
            renderTab(route, idx, true, route.name === "arcade")
          )}
        </View>

        {/* Right tab (Wallets) */}
        <View className="flex-1 items-start pl-6">
          {outerTabs.find((r) => r.name === "wallets") &&
            renderTab(
              outerTabs.find((r) => r.name === "wallets")!,
              1,
              false,
              false
            )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 88,
  },
  glassBackground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 88,
  },
  tabContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  centerGroup: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  arcadeButton: {
    borderColor: "#FF8C32",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  arcadeButtonFocused: {
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  arcadeIcon: {
    textShadowColor: "rgba(255, 140, 50, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
