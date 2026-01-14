import { View, Text, Image, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

interface HeaderProps {
  userName: string;
  userLevel: number;
  avatarUrl?: string;
  coins: number;
}

export function Header({ userName, userLevel, avatarUrl, coins }: HeaderProps) {
  const insets = useSafeAreaInsets();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <View
      className="flex-row items-center justify-between px-5 pb-4 bg-background-dark/90"
      style={{ paddingTop: insets.top + 12 }}
    >
      {/* Left: Avatar + Greeting */}
      <View className="flex-row items-center gap-3">
        {/* Avatar with gradient border and circular glow */}
        <View className="relative" style={styles.avatarContainer}>
          <LinearGradient
            colors={["#FF8C32", "#FFD166"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <View className="h-full w-full rounded-full bg-background-dark overflow-hidden border-2 border-background-dark">
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-full w-full bg-card-dark items-center justify-center">
                  <Text className="text-xl">👤</Text>
                </View>
              )}
            </View>
          </LinearGradient>
          {/* Level badge */}
          <View className="absolute -bottom-1 -right-1 bg-gold px-1.5 py-0.5 rounded-full border-2 border-background-dark">
            <Text className="text-background-dark text-[9px] font-bold">
              Lv {userLevel}
            </Text>
          </View>
        </View>

        {/* Greeting */}
        <View>
          <Text className="text-white text-lg font-bold tracking-tight">
            {getGreeting()}, {userName} 👋
          </Text>
          <Text className="text-text-secondary text-xs font-medium">
            You're doing great today
          </Text>
        </View>
      </View>

      {/* Right: Coins */}
      <View className="px-3 py-1.5 rounded-full bg-card-dark border border-white/5 flex-row items-center gap-1.5">
        <Text className="text-base">🪙</Text>
        <Text className="text-white text-xs font-bold">
          {coins.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    // Circular glow effect
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    borderRadius: 999,
  },
  avatarGradient: {
    height: 48,
    width: 48,
    borderRadius: 999,
    padding: 2,
  },
});

