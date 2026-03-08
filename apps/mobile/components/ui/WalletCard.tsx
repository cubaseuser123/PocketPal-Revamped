import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

// ─── Shared types ──────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  emoji: string;
}

// ─── Theme configs ─────────────────────────────────────────────

const THEMES = {
  expense: {
    icon: "account-balance-wallet" as const,
    iconColor: "#FF8C32",
    glowColor: "bg-primary/10",
    progressStroke: "#FF8C32",
    label: "Expense Wallet",
    balanceSub: "Available to spend",
    borderCompact: "border-white/5",
    borderFull: "border-primary",
    iconBg: "bg-primary/10",
    actionBorderColor: undefined,
    actionBg: undefined,
    actionTextColor: undefined,
    actionIconColor: undefined,
  },
  savings: {
    icon: "savings" as const,
    iconColor: "#818CF8",       // compact (indigo)
    iconColorFull: "#FFD166",   // full (gold)
    glowColor: "bg-indigo-500/10",
    glowColorFull: "bg-gold/10",
    progressStroke: "#6366F1",
    progressStrokeFull: "#FFD166",
    label: "Savings Wallet",
    balanceSub: undefined,
    borderCompact: "border-white/5",
    borderFull: "border-gold/30",
    actionBorderCompact: "border-indigo-500/50",
    actionBgCompact: "active:bg-indigo-500/10",
    actionTextColorCompact: "text-indigo-300",
    actionIconColorCompact: "#A5B4FC",
    actionBorderFull: "border-gold/50",
    actionBgFull: "active:bg-gold/10",
    actionTextColorFull: "text-gold",
    actionIconColorFull: "#FFD166",
  },
};

// ─── Props ─────────────────────────────────────────────────────

interface WalletCardBaseProps {
  type: "expense" | "savings";
  variant: "compact" | "full";
  balance: number;
}

interface ExpenseProps extends WalletCardBaseProps {
  type: "expense";
  categories: Category[];
  // compact
  onGoTo?: () => void;
  // full
  onScan?: () => void;
  onLoadMoney?: () => void;
  onMore?: () => void;
}

interface SavingsProps extends WalletCardBaseProps {
  type: "savings";
  goalName: string;
  goalEmoji: string;
  targetAmount: number;
  hasGoal?: boolean;
  // compact
  onGoTo?: () => void;
  // full
  onAddToSavings?: () => void;
}

export type WalletCardProps = ExpenseProps | SavingsProps;

// ─── Component ─────────────────────────────────────────────────

export function WalletCard(props: WalletCardProps) {
  const { type, variant, balance } = props;
  const isCompact = variant === "compact";
  const isFull = variant === "full";

  // ── Expense card ──
  if (type === "expense") {
    const { categories, onGoTo, onScan, onLoadMoney, onMore } = props as ExpenseProps;
    const borderClass = isCompact ? THEMES.expense.borderCompact : THEMES.expense.borderFull;
    const balanceSizeClass = isCompact ? "text-3xl" : "text-4xl";

    return (
      <View
        className={`bg-card-dark rounded-3xl p-5 border ${borderClass} relative overflow-hidden`}
        style={isFull ? styles.cardShadow : undefined}
      >
        {/* Background glow */}
        <View className="absolute -top-16 -right-16 w-40 h-40 bg-primary/10 rounded-full" />

        {/* Header */}
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center gap-2">
            <View className="p-1.5 bg-primary/10 rounded-lg">
              <MaterialIcons name="account-balance-wallet" size={20} color="#FF8C32" />
            </View>
            <Text className="text-white font-semibold text-base">Expense Wallet</Text>
          </View>
          <TouchableOpacity onPress={onMore}>
            <MaterialIcons name="more-horiz" size={20} color="#B0B0C3" />
          </TouchableOpacity>
        </View>

        {/* Balance */}
        <View className="mb-4">
          <Text className={`${balanceSizeClass} font-bold text-white tracking-tight`}>
            ₹{balance.toLocaleString()}
          </Text>
          <Text className="text-text-secondary text-xs mt-1">Available to spend</Text>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4 -mx-1"
          contentContainerStyle={{ paddingHorizontal: 4, gap: 12 }}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              className="flex-row items-center gap-2 rounded-xl bg-card-dark-secondary px-3 py-2 border border-transparent active:border-primary/30"
            >
              <Text className="text-base">{category.emoji}</Text>
              <Text className="text-white text-xs font-medium">{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Action buttons */}
        {isCompact ? (
          <TouchableOpacity
            onPress={onGoTo}
            className="w-full bg-primary py-3 rounded-xl flex-row items-center justify-center gap-1.5 active:bg-primary-hover"
            style={styles.primaryButtonShadow}
          >
            <MaterialIcons name="arrow-forward" size={20} color="white" />
            <Text className="text-white text-sm font-bold">Go To</Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onScan}
              className="bg-card-dark-secondary p-3 rounded-xl items-center justify-center border border-white/5 active:bg-card-dark-secondary/80"
              style={{ aspectRatio: 1 }}
            >
              <MaterialIcons name="qr-code-scanner" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onLoadMoney}
              className="flex-1 bg-primary py-3 rounded-xl flex-row items-center justify-center gap-2 active:bg-primary-hover"
              style={styles.primaryButtonShadow}
            >
              <MaterialIcons name="account-balance" size={20} color="white" />
              <Text className="text-white text-sm font-bold">Load Money</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ── Savings card ──
  const { goalName, goalEmoji, targetAmount, hasGoal, onGoTo, onAddToSavings } = props as SavingsProps;
  const goalExists = hasGoal !== undefined ? hasGoal : true;
  const progress = goalExists && targetAmount > 0 ? Math.min((balance / targetAmount) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 15.9155;
  const strokeDasharray = `${(progress / 100) * circumference}, ${circumference}`;

  // Variant-specific theming
  const borderClass = isCompact ? "border-white/5" : "border-gold/30";
  const glowClass = isCompact ? "bg-indigo-500/10" : "bg-gold/10";
  const balanceSizeClass = isCompact ? "text-2xl" : "text-3xl";
  const savingsIconColor = isCompact ? "#818CF8" : "#FFD166";
  const progressStroke = isCompact ? "#6366F1" : "#FFD166";
  const progressDisplay = isCompact ? `${Math.round(progress)}%` : `${progress.toFixed(1)}%`;

  const actionBorderClass = isCompact ? "border-indigo-500/50" : "border-gold/50";
  const actionActiveBg = isCompact ? "active:bg-indigo-500/10" : "active:bg-gold/10";
  const actionTextClass = isCompact ? "text-indigo-300" : "text-gold";
  const actionIconColor = isCompact ? "#A5B4FC" : "#FFD166";

  return (
    <View
      className={`bg-card-dark rounded-3xl p-5 border ${borderClass} relative overflow-hidden`}
      style={isFull ? styles.cardShadow : undefined}
    >
      {/* Background glow */}
      <View className={`absolute -top-16 -right-16 w-40 h-40 ${glowClass} rounded-full`} />

      {/* Header */}
      <View className="flex-row justify-between items-start mb-4">
        <View className="gap-1">
          <View className="flex-row items-center gap-2 mb-1">
            <MaterialIcons name="savings" size={20} color={savingsIconColor} />
            <Text className="text-white font-semibold text-base">Savings Wallet</Text>
          </View>
          <Text className="text-white text-lg font-bold">
            {goalName} {goalEmoji}
          </Text>
          {(isFull || goalExists) && (
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
            <Circle cx={18} cy={18} r={15.9155} fill="none" stroke="#2A2A35" strokeWidth={3} />
            <Circle
              cx={18}
              cy={18}
              r={15.9155}
              fill="none"
              stroke={progressStroke}
              strokeWidth={3}
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
            />
          </Svg>
          <Text className="absolute text-[10px] font-bold text-white">{progressDisplay}</Text>
        </View>
      </View>

      {/* Balance */}
      <Text className={`${balanceSizeClass} font-bold text-white tracking-tight mb-4`}>
        ₹{balance.toLocaleString()}
      </Text>

      {/* Action button */}
      {isCompact ? (
        <TouchableOpacity
          onPress={onGoTo}
          className={`w-full bg-transparent border-2 ${actionBorderClass} py-3 px-4 rounded-xl flex-row items-center justify-center gap-2 ${actionActiveBg}`}
        >
          <MaterialIcons name="arrow-forward" size={20} color={actionIconColor} />
          <Text className={`${actionTextClass} font-semibold`}>Go To</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onAddToSavings}
          className={`w-full bg-transparent border-2 ${actionBorderClass} py-3 px-4 rounded-xl flex-row items-center justify-center gap-2 ${actionActiveBg}`}
        >
          <MaterialIcons name="payments" size={20} color={actionIconColor} />
          <Text className={`${actionTextClass} font-semibold`}>Add to Savings</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  primaryButtonShadow: {
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5,
  },
});
