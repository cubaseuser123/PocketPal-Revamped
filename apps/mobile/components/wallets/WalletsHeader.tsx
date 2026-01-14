import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface WalletsHeaderProps {
  totalBalance: number;
}

export function WalletsHeader({ totalBalance }: WalletsHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-end justify-between px-5 pb-4 bg-background-dark/90"
      style={{ paddingTop: insets.top + 12 }}
    >
      {/* Left: Title */}
      <View className="gap-1">
        <Text className="text-white text-3xl font-extrabold tracking-tight">
          Wallets
        </Text>
        <Text className="text-text-secondary text-sm font-medium">
          Your money, organized
        </Text>
      </View>

      {/* Right: Total Balance */}
      <View className="px-3 py-1.5 rounded-full bg-card-dark border border-white/5 flex-row items-center gap-1.5 mb-1">
        <Text className="text-base">🪙</Text>
        <Text className="text-white text-sm font-bold">
          ₹{totalBalance.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}
