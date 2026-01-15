import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { PallyIcon } from "../ui/PallyIcon";

interface MoveMoneyCardProps {
  onPress: () => void;
}

export function MoveMoneyCard({ onPress }: MoveMoneyCardProps) {
  return (
    <View className="relative py-3">
      {/* Floating badge */}
      <View
        className="absolute -top-0 left-1/2 z-10 bg-primary px-3 py-1 rounded-full border border-primary flex-row items-center gap-1"
        style={[styles.badge, { transform: [{ translateX: -70 }] }]}
      >
        <View className="flex-row items-center gap-1">
          <Text className="text-background-dark text-[10px] font-bold">
            Move smart, not fast
          </Text>
          <PallyIcon size={12} />
        </View>
      </View>

      {/* Card */}
      <TouchableOpacity
        onPress={onPress}
        className="bg-card-dark border border-white/10 p-3 rounded-2xl flex-row items-center justify-between active:border-primary/30"
      >
        <View className="flex-row items-center gap-3">
          {/* Icon */}
          <View className="h-10 w-10 rounded-full bg-card-dark-secondary items-center justify-center">
            <MaterialIcons name="swap-horiz" size={24} color="#FF8C32" />
          </View>

          {/* Text */}
          <View>
            <Text className="text-white font-bold text-sm">Move Money</Text>
            <Text className="text-text-secondary text-[10px]">
              Instant Transfer
            </Text>
          </View>
        </View>

        {/* Chevron */}
        <MaterialIcons name="chevron-right" size={24} color="#B0B0C3" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 5,
  },
});
