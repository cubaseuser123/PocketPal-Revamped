import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface Category {
  id: string;
  name: string;
  emoji: string;
}

interface ExpenseWalletCardProps {
  balance: number;
  categories: Category[];
  onScan: () => void;
  onLoadMoney: () => void;
  onMore: () => void;
}

export function ExpenseWalletCard({
  balance,
  categories,
  onScan,
  onLoadMoney,
  onMore,
}: ExpenseWalletCardProps) {
  return (
    <View
      className="bg-card-dark rounded-3xl p-5 border border-primary relative overflow-hidden"
      style={styles.card}
    >
      {/* Background glow */}
      <View className="absolute -top-16 -right-16 w-40 h-40 bg-primary/10 rounded-full" />

      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center gap-2">
          <View className="p-1.5 bg-primary/10 rounded-lg">
            <MaterialIcons
              name="account-balance-wallet"
              size={20}
              color="#FF8C32"
            />
          </View>
          <Text className="text-white font-semibold text-base">
            Expense Wallet
          </Text>
        </View>
        <TouchableOpacity onPress={onMore}>
          <MaterialIcons name="more-horiz" size={20} color="#B0B0C3" />
        </TouchableOpacity>
      </View>

      {/* Balance */}
      <View className="mb-4">
        <Text className="text-4xl font-bold text-white tracking-tight">
          ₹{balance.toLocaleString()}
        </Text>
        <Text className="text-text-secondary text-xs mt-1">
          Available to spend
        </Text>
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
            <Text className="text-white text-xs font-medium">
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Action buttons */}
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
          style={styles.loadButton}
        >
          <MaterialIcons name="account-balance" size={20} color="white" />
          <Text className="text-white text-sm font-bold">Load Money</Text>
        </TouchableOpacity>
      </View>
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
  loadButton: {
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5,
  },
});
