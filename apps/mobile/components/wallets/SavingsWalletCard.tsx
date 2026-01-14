import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

interface SavingsWalletCardProps {
  balance: number;
  goalName: string;
  goalEmoji: string;
  targetAmount: number;
  onAddToSavings: () => void;
}

export function SavingsWalletCard({
  balance,
  goalName,
  goalEmoji,
  targetAmount,
  onAddToSavings,
}: SavingsWalletCardProps) {
  const progress = Math.min((balance / targetAmount) * 100, 100);
  const circumference = 2 * Math.PI * 15.9155;
  const strokeDasharray = `${(progress / 100) * circumference}, ${circumference}`;

  return (
    <View
      className="bg-card-dark rounded-3xl p-5 border border-gold/30 relative overflow-hidden"
      style={styles.card}
    >
      {/* Background glow */}
      <View className="absolute -top-16 -right-16 w-40 h-40 bg-gold/10 rounded-full" />

      {/* Header */}
      <View className="flex-row justify-between items-start mb-4">
        <View className="gap-1">
          <View className="flex-row items-center gap-2 mb-1">
            <MaterialIcons name="savings" size={20} color="#FFD166" />
            <Text className="text-white font-semibold text-base">
              Savings Wallet
            </Text>
          </View>
          <Text className="text-white text-lg font-bold">
            {goalName} {goalEmoji}
          </Text>
          <Text className="text-text-secondary text-xs">
            Target: ₹{targetAmount.toLocaleString()}
          </Text>
        </View>

        {/* Circular progress */}
        <View className="h-14 w-14 items-center justify-center">
          <Svg
            width={56}
            height={56}
            viewBox="0 0 36 36"
            style={{ transform: [{ rotate: "-90deg" }] }}
          >
            {/* Background circle */}
            <Circle
              cx={18}
              cy={18}
              r={15.9155}
              fill="none"
              stroke="#2A2A35"
              strokeWidth={3}
            />
            {/* Progress circle */}
            <Circle
              cx={18}
              cy={18}
              r={15.9155}
              fill="none"
              stroke="#FFD166"
              strokeWidth={3}
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
            />
          </Svg>
          <Text className="absolute text-[10px] font-bold text-white">
            {progress.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Balance */}
      <Text className="text-3xl font-bold text-white tracking-tight mb-4">
        ₹{balance.toLocaleString()}
      </Text>

      {/* Add to savings button */}
      <TouchableOpacity
        onPress={onAddToSavings}
        className="w-full bg-transparent border-2 border-gold/50 py-3 px-4 rounded-xl flex-row items-center justify-center gap-2 active:bg-gold/10"
      >
        <MaterialIcons name="payments" size={20} color="#FFD166" />
        <Text className="text-gold font-semibold">Add to Savings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});
