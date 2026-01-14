import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { PageHeader } from "../../components/ui/PageHeader";
import { PallyTip } from "../../components/dashboard/PallyTip";
import { WeeklySavingGoal } from "../../components/dashboard/WeeklySavingGoal";
import { PredictionCard } from "../../components/dashboard/PredictionCard";
import { SpendingOverview } from "../../components/dashboard/SpendingOverview";
import { ExpenseWallet } from "../../components/dashboard/ExpenseWallet";
import { SavingsWallet } from "../../components/dashboard/SavingsWallet";
import { ArcadeTeaser } from "../../components/dashboard/ArcadeTeaser";

// Mock data - replace with real data later
const MOCK_USER = {
  name: "Harsh",
  level: 3,
  avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgYdfbobFGGHhdgWxoDaUCEs63jw9XW071wbK2QOYAOFr2eumOPIZMnD4-EjLmX6rpo5RGDb2w1yX4aDUQ6EuQ5xXpNfNjDkmAcC6QV19DO-_WOjqzKcvsUddIdhAIoXsc44nJ5qv_DFXZN-5kHrVbywVjAefDZkPu9VYMbmKDlrkI7-01lLtYfjGqT8HhqjjRJdzf7-8hyPXlzBFCC5c83r8oPLzacBgkgNoAi_VuLjUYw0rUrW6s635ldlnrqY4JmjbwWVebHIwZ",
  coins: 1250,
};

const MOCK_CATEGORIES = [
  { id: "1", name: "Food", emoji: "🍕" },
  { id: "2", name: "Travel", emoji: "🚌" },
  { id: "3", name: "Shop", emoji: "🛍️" },
];

// Mock spending data for different periods
const MOCK_SPENDING_DATA = {
  week: {
    spent: 1530,
    avgPerDay: 218,
    label: "This week spent",
    chartPath: "M0 40 Q 15 35, 25 38 T 50 20 T 75 25 T 100 10",
    chartFillPath: "M0 40 Q 15 35, 25 38 T 50 20 T 75 25 T 100 10 V 50 H 0 Z",
    xLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  month: {
    spent: 6420,
    avgPerDay: 214,
    label: "This month spent",
    chartPath: "M0 35 Q 20 30, 35 25 T 60 35 T 80 20 T 100 15",
    chartFillPath: "M0 35 Q 20 30, 35 25 T 60 35 T 80 20 T 100 15 V 50 H 0 Z",
    xLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
  },
  "3m": {
    spent: 18750,
    avgPerDay: 208,
    label: "Last 3 months spent",
    chartPath: "M0 30 Q 25 40, 40 25 T 70 30 T 100 12",
    chartFillPath: "M0 30 Q 25 40, 40 25 T 70 30 T 100 12 V 50 H 0 Z",
    xLabels: ["Nov", "Dec", "Jan"],
  },
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "3m">("week");

  const handleScan = () => {
    console.log("Scan QR");
  };

  const handleLoadMoney = () => {
    console.log("Load money");
  };

  const handleAddToSavings = () => {
    console.log("Add to savings");
  };

  const handleEnterArcade = () => {
    router.push("/(tabs)/arcade");
  };

  const handleAvatarPress = () => {
    router.push("/profile");
  };

  return (
    <View className="flex-1 bg-background-dark">
      {/* Header - sticky */}
      <PageHeader
        title="Home"
        showAvatar
        userName={MOCK_USER.name}
        userLevel={MOCK_USER.level}
        avatarUrl={MOCK_USER.avatarUrl}
        coins={MOCK_USER.coins}
        onAvatarPress={handleAvatarPress}
      />

      {/* Scrollable content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120 + insets.bottom,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pally Tip */}
        <PallyTip message="Small saves beat big regrets. Let's go!" />

        {/* Weekly Saving Goal */}
        <WeeklySavingGoal
          currentAmount={1200}
          targetAmount={2000}
          status="on-track"
          todaySaved={450}
        />

        {/* Prediction */}
        <PredictionCard
          category="Food"
          prediction="is projected to be 15% higher this weekend."
        />

        {/* Spending Overview */}
        <SpendingOverview
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          data={MOCK_SPENDING_DATA}
        />

        {/* Expense Wallet */}
        <ExpenseWallet
          balance={2350}
          categories={MOCK_CATEGORIES}
          onScan={handleScan}
          onLoadMoney={handleLoadMoney}
        />

        {/* Savings Wallet */}
        <SavingsWallet
          balance={4800}
          goalName="Laptop Fund"
          goalEmoji="💻"
          targetAmount={50000}
          onAddToSavings={handleAddToSavings}
        />

        {/* Arcade Teaser */}
        <ArcadeTeaser onEnterArcade={handleEnterArcade} />
      </ScrollView>
    </View>
  );
}
