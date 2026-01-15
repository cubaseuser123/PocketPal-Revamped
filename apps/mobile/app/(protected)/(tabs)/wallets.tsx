import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PageHeader } from "../../../components/ui/PageHeader";
import { PallyTip } from "../../../components/dashboard/PallyTip";
import { ExpenseWalletCard } from "../../../components/wallets/ExpenseWalletCard";
import { TransactionList } from "../../../components/wallets/TransactionList";
import { MoveMoneyCard } from "../../../components/wallets/MoveMoneyCard";
import { SavingsWalletCard } from "../../../components/wallets/SavingsWalletCard";

// Mock data
const MOCK_CATEGORIES = [
  { id: "1", name: "Food", emoji: "🍕" },
  { id: "2", name: "Travel", emoji: "🚌" },
  { id: "3", name: "Shop", emoji: "🛍️" },
];

const MOCK_TRANSACTIONS = [
  {
    id: "1",
    name: "Zomato",
    emoji: "🍕",
    amount: -245,
    date: "Today, 1:24 PM",
    categoryColor: "#EF4444",
  },
  {
    id: "2",
    name: "Uber",
    emoji: "🚗",
    amount: -180,
    date: "Yesterday, 6:30 PM",
    categoryColor: "#FFFFFF",
  },
  {
    id: "3",
    name: "Cafe Coffee Day",
    emoji: "☕",
    amount: -320,
    date: "Yesterday, 4:15 PM",
    categoryColor: "#FF8C32",
  },
];

const EXPENSE_BALANCE = 2350;
const SAVINGS_BALANCE = 4800;
const TOTAL_BALANCE = EXPENSE_BALANCE + SAVINGS_BALANCE;

export default function WalletsScreen() {
  const insets = useSafeAreaInsets();

  const handleScan = () => {
    console.log("Scan QR");
  };

  const handleLoadMoney = () => {
    console.log("Load money");
  };

  const handleMore = () => {
    console.log("More options");
  };

  const handleMoveMoney = () => {
    console.log("Move money");
  };

  const handleAddToSavings = () => {
    console.log("Add to savings");
  };

  const handleTransactionPress = (id: string) => {
    console.log("Transaction pressed:", id);
  };

  return (
    <View className="flex-1 bg-background-dark">
      {/* Header */}
      <PageHeader
        title="Wallets"
        subtitle="Your money, organized"
        coins={TOTAL_BALANCE}
      />

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
        {/* Pally Tip */}
        <PallyTip message="Expense wallet for spending, savings wallet for winning 🐿️" />

        {/* Expense Wallet */}
        <ExpenseWalletCard
          balance={EXPENSE_BALANCE}
          categories={MOCK_CATEGORIES}
          onScan={handleScan}
          onLoadMoney={handleLoadMoney}
          onMore={handleMore}
        />

        {/* Recent Transactions */}
        <TransactionList
          transactions={MOCK_TRANSACTIONS}
          onTransactionPress={handleTransactionPress}
        />

        {/* Move Money */}
        <MoveMoneyCard onPress={handleMoveMoney} />

        {/* Savings Wallet */}
        <SavingsWalletCard
          balance={SAVINGS_BALANCE}
          goalName="Laptop Fund"
          goalEmoji="💻"
          targetAmount={50000}
          onAddToSavings={handleAddToSavings}
        />
      </ScrollView>
    </View>
  );
}
