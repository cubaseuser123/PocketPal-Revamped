import { ScrollView, View, ActivityIndicator, Text, RefreshControl } from "react-native";
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
import { TransactionDetailsModal } from "../../../components/wallets/TransactionDetailsModal";
import { useWallets, useTransactions, useCategories, useGoals, useUser } from "../../../hooks/useApi";
import { useState, useCallback } from "react";

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
  const { wallets, loading: walletsLoading, addMoney, transfer, refetch: refetchWallets } = useWallets();
  // Fetch user data for correct coin balance
  const { user } = useUser();
  const { transactions, loading: transactionsLoading, refetch: refetchTransactions } = useTransactions();
  const { categories } = useCategories();
  const { goals } = useGoals();

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchWallets(), refetchTransactions()]);
    setRefreshing(false);
  }, [refetchWallets, refetchTransactions]);

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
    router.push("/(protected)/scan-qr");
  };

  const handleLoadMoney = () => {
    router.push("/(protected)/load-money");
  };

  const handleMore = () => {
    console.log("More options");
  };

  const handleMoveMoney = () => {
    router.push("/(protected)/transfer-money");
  };

  const handleAddToSavings = () => {
    router.push("/(protected)/transfer-money");
  };

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleTransactionPress = (id: string) => {
    const transaction = transactions.find(t => t._id === id);
    if (!transaction) return;

    if (transaction.groupId) {
      // Navigate to Split Group
      router.push({
        pathname: "/(protected)/split-group-chat",
        params: { id: transaction.groupId }
      } as any);
    } else {
      // Show Details Modal
      setSelectedTransaction(transaction);
      setModalVisible(true);
    }
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
    <>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF8C32" />}
      >
        {/* Pally Tip - show PPI type info */}
        <PallyTip 
          message={
            wallets?.kycCompleted 
              ? "Full KYC PPI: UPI and transfers enabled! 🚀" 
              : "Small PPI: Complete KYC to unlock UPI & higher limits"
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
          transactions={formattedTransactions.slice(0, 5)}
          onTransactionPress={handleTransactionPress}
          onViewAll={() => router.push("/(protected)/history" as any)}
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
    
    <TransactionDetailsModal
        visible={modalVisible}
        transaction={selectedTransaction}
        onClose={() => setModalVisible(false)}
    />
    </>
  );
}
