import { ScrollView, View, ActivityIndicator, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

import { PageHeader } from "../../../components/ui/PageHeader";
import { PallyTip } from "../../../components/dashboard/PallyTip";
import { ExpenseWalletCard } from "../../../components/wallets/ExpenseWalletCard";
import { TransactionList } from "../../../components/wallets/TransactionList";
import { MoveMoneyCard } from "../../../components/wallets/MoveMoneyCard";
import { SavingsWalletCard } from "../../../components/wallets/SavingsWalletCard";
import { useWallets, useTransactions, useCategories, useGoals, useUser } from "../../../hooks/useApi";

// Helper to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  
  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + `, ${time}`;
};

export default function WalletsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // API hooks
  const { wallets, loading: walletsLoading, addMoney, transfer } = useWallets();
  // Fetch user data for correct coin balance
  const { user } = useUser();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { categories } = useCategories();
  const { goals } = useGoals();

  // Get featured goal for savings widget
  const featuredGoal = goals?.find(g => g.isFeatured) || goals?.[0];

  // Map transactions for the list
  const formattedTransactions = (transactions || []).map(t => ({
    id: t._id,
    name: t.name,
    emoji: t.emoji,
    amount: t.amount,
    date: formatDate(t.createdAt),
    categoryColor: "#FF8C32", // Default color
  }));

  const handleScan = () => {
    console.log("Scan QR");
    // Check if UPI is enabled
    if (wallets?.primary?.limits?.upiEnabled === false) {
      console.log("UPI not available for Small PPI. Complete KYC to enable.");
    }
  };

  const handleLoadMoney = () => {
    console.log("Load money");
    // TODO: Navigate to add money screen
  };

  const handleMore = () => {
    console.log("More options");
  };

  const handleMoveMoney = () => {
    router.push("/(protected)/transfer-money");
  };

  const handleAddToSavings = () => {
    console.log("Add to savings");
  };

  const handleTransactionPress = (id: string) => {
    console.log("Transaction pressed:", id);
  };

  // Show loading state
  if (walletsLoading) {
    return (
      <View className="flex-1 bg-background-dark items-center justify-center">
        <ActivityIndicator size="large" color="#FF8C32" />
        <Text className="text-white mt-4">Loading wallets...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-dark">
      {/* Header */}
      <PageHeader
        title="Wallets"
        subtitle="Your money, organized"
        coins={user?.coins || 0}
      />
      
      {/* ... (rest of the component) */}

      {/* Scrollable content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120 + insets.bottom,
          gap: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pally Tip - show PPI type info */}
        <PallyTip 
          message={
            wallets?.kycCompleted 
              ? "Full KYC PPI: UPI and transfers enabled! 🚀" 
              : "Small PPI: Complete KYC to unlock UPI & higher limits 🐿️"
          } 
        />

        {/* Expense Wallet (Primary) */}
        <ExpenseWalletCard
          balance={wallets?.primary?.balance || 0}
          categories={(categories || []).slice(0, 3).map(c => ({ id: c._id, name: c.name, emoji: c.emoji }))}
          onScan={handleScan}
          onLoadMoney={handleLoadMoney}
          onMore={handleMore}
        />

        {/* Subscriptions Link */}
        <TouchableOpacity
          style={{
            backgroundColor: "#2A2A35",
            padding: 16,
            borderRadius: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between"
          }}
          onPress={() => router.push("/(protected)/subscriptions")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ 
              width: 40, height: 40, borderRadius: 20, 
              backgroundColor: "rgba(255, 140, 50, 0.1)", 
              alignItems: "center", justifyContent: "center" 
            }}>
              <MaterialIcons name="payment" size={24} color="#FF8C32" />
            </View>
            <View>
              <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}>Subscriptions</Text>
              <Text style={{ color: "#AAA", fontSize: 12 }}>Manage recurring payments</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>

        {/* Recent Transactions */}
        <TransactionList
          transactions={formattedTransactions}
          onTransactionPress={handleTransactionPress}
        />

        {/* Move Money */}
        <MoveMoneyCard onPress={handleMoveMoney} />

        {/* Savings Wallet */}
        <SavingsWalletCard
          balance={wallets?.savings?.balance || 0}
          goalName={featuredGoal?.name || "Start a Goal"}
          goalEmoji={featuredGoal?.emoji || "🎯"}
          targetAmount={featuredGoal?.targetAmount || 50000}
          onAddToSavings={handleAddToSavings}
        />
      </ScrollView>
    </View>
  );
}
