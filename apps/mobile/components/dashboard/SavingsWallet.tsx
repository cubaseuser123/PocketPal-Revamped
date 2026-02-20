import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, { Path, Circle } from "react-native-svg";

interface SavingsWalletProps {
  balance: number;
  goalName: string;
  goalEmoji: string;
  targetAmount: number;
  onGoTo: () => void;
  hasGoal?: boolean;
}

export function SavingsWallet({
  balance,
  goalName,
  goalEmoji,
  targetAmount,
  onGoTo,
  hasGoal = true,
}: SavingsWalletProps) {
  const progress = (hasGoal && targetAmount > 0) ? Math.min((balance / targetAmount) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 15.9155;
  const strokeDasharray = `${(progress / 100) * circumference}, ${circumference}`;

  return (
    <View className="bg-card-dark rounded-3xl p-5 border border-white/5 relative overflow-hidden">
      {/* Background glow - positioned to be cut off at top-right */}
      <View className="absolute -top-16 -right-16 w-40 h-40 bg-indigo-500/10 rounded-full" />

      {/* Header */}
      <View className="flex-row justify-between items-start mb-4">
        <View className="gap-1">
          <View className="flex-row items-center gap-2 mb-1">
            <MaterialIcons name="savings" size={20} color="#818CF8" />
            <Text className="text-white font-semibold text-base">
              Savings Wallet
            </Text>
          </View>
          <Text className="text-white text-lg font-bold">
            {goalName} {goalEmoji}
          </Text>
          {hasGoal && (
            <Text className="text-text-secondary text-xs">
              Target: ₹{targetAmount.toLocaleString()}
            </Text>
          )}
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
              stroke="#6366F1"
              strokeWidth={3}
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
            />
          </Svg>
          <Text className="absolute text-[10px] font-bold text-white">
            {Math.round(progress)}%
          </Text>
        </View>
      </View>

      {/* Balance */}
      <Text className="text-2xl font-bold text-white tracking-tight mb-4">
        ₹{balance.toLocaleString()}
      </Text>

      {/* Action button */}
      <TouchableOpacity
        onPress={onGoTo}
        className="w-full bg-transparent border-2 border-indigo-500/50 py-3 px-4 rounded-xl flex-row items-center justify-center gap-2 active:bg-indigo-500/10"
      >
        <MaterialIcons name="arrow-forward" size={20} color="#A5B4FC" />
        <Text className="text-indigo-300 font-semibold">Go To</Text>
      </TouchableOpacity>
    </View>
  );
}
