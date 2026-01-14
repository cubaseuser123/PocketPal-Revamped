import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface ArcadeTeaserProps {
  onEnterArcade: () => void;
}

export function ArcadeTeaser({ onEnterArcade }: ArcadeTeaserProps) {
  return (
    <View className="relative w-full overflow-hidden rounded-3xl">
      {/* Gradient border */}
      <LinearGradient
        colors={["#FF8C32", "#B936F5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0 rounded-3xl p-[1px]"
      />

      {/* Content container */}
      <View className="bg-card-dark rounded-[22px] m-[1px] p-5 overflow-hidden relative">
        {/* Background effects */}
        <View className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10 opacity-50" />
        <View className="absolute -right-5 -top-5 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />

        {/* Content */}
        <View className="gap-4 relative z-10">
          {/* Header */}
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="sports-esports" size={24} color="#FACC15" />
              <Text className="text-xl font-bold text-white">
                PocketPal Arcade
              </Text>
            </View>
            <View className="bg-white/10 px-2 py-1 rounded border border-white/5">
              <Text className="text-[10px] text-white font-bold uppercase tracking-wide">
                Play & Earn
              </Text>
            </View>
          </View>

          {/* Feature icons */}
          <View className="flex-row justify-between items-center px-2">
            {/* Streaks */}
            <View className="items-center gap-1">
              <View className="h-10 w-10 bg-orange-500/20 rounded-full items-center justify-center border border-orange-500/30">
                <Text className="text-xl">🔥</Text>
              </View>
              <Text className="text-[10px] text-text-secondary font-medium">
                Streaks
              </Text>
            </View>

            {/* Divider */}
            <View className="w-8 h-[1px] bg-white/10" />

            {/* Bosses */}
            <View className="items-center gap-1">
              <View className="h-10 w-10 bg-purple-500/20 rounded-full items-center justify-center border border-purple-500/30">
                <Text className="text-xl">👾</Text>
              </View>
              <Text className="text-[10px] text-text-secondary font-medium">
                Bosses
              </Text>
            </View>

            {/* Divider */}
            <View className="w-8 h-[1px] bg-white/10" />

            {/* Rewards */}
            <View className="items-center gap-1">
              <View className="h-10 w-10 bg-yellow-500/20 rounded-full items-center justify-center border border-yellow-500/30">
                <Text className="text-xl">🏆</Text>
              </View>
              <Text className="text-[10px] text-text-secondary font-medium">
                Rewards
              </Text>
            </View>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            onPress={onEnterArcade}
            className="w-full bg-white py-3.5 rounded-xl flex-row items-center justify-center gap-2 active:bg-gray-100"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Text className="text-black font-bold text-base">Enter Arcade</Text>
            <MaterialIcons name="arrow-forward" size={18} color="black" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
