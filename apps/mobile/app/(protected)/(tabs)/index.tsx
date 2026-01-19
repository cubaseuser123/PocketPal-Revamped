import { useState, useEffect } from "react";
import { ScrollView, View, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

import { PageHeader } from "../../../components/ui/PageHeader";
import { PallyTip } from "../../../components/dashboard/PallyTip";
import { WeeklySavingGoal } from "../../../components/dashboard/WeeklySavingGoal";
import { PredictionCard } from "../../../components/dashboard/PredictionCard";
import { SpendingOverview } from "../../../components/dashboard/SpendingOverview";
import { ExpenseWallet } from "../../../components/dashboard/ExpenseWallet";
import { SavingsWallet } from "../../../components/dashboard/SavingsWallet";
import { ArcadeTeaser } from "../../../components/dashboard/ArcadeTeaser";
import { ActiveSplitGroups } from "../../../components/dashboard/ActiveSplitGroups";
import { useUser, useWallets, useSpendingSummary, useCategories, useGoals, getFullAvatarUrl } from "../../../hooks/useApi";

// Static spending chart data (would come from analytics API in future)
const SPENDING_CHART_DATA = {
  week: {
    chartPath: "M0 40 Q 15 35, 25 38 T 50 20 T 75 25 T 100 10",
    chartFillPath: "M0 40 Q 15 35, 25 38 T 50 20 T 75 25 T 100 10 V 50 H 0 Z",
    xLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  month: {
    chartPath: "M0 35 Q 20 30, 35 25 T 60 35 T 80 20 T 100 15",
    chartFillPath: "M0 35 Q 20 30, 35 25 T 60 35 T 80 20 T 100 15 V 50 H 0 Z",
    xLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
  },
  "3m": {
    chartPath: "M0 30 Q 25 40, 40 25 T 70 30 T 100 12",
    chartFillPath: "M0 30 Q 25 40, 40 25 T 70 30 T 100 12 V 50 H 0 Z",
    xLabels: ["Nov", "Dec", "Jan"],
  },
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "3m">("week");

  // API hooks
  const { user, loading: userLoading } = useUser();
  const { wallets, loading: walletsLoading } = useWallets();
  const { summary, refetch: refetchSummary } = useSpendingSummary(selectedPeriod);
  const { categories } = useCategories();
  const { goals } = useGoals();

  // Refetch spending summary when period changes
  useEffect(() => {
    refetchSummary();
  }, [selectedPeriod]);

  // Get featured goal for savings widget
  const featuredGoal = goals?.find(g => g.isFeatured) || goals?.[0];

  // Build spending data from API
  const spendingData = {
    week: {
      spent: selectedPeriod === "week" ? (summary?.totalSpent || 0) : 0,
      avgPerDay: selectedPeriod === "week" ? (summary?.avgPerDay || 0) : 0,
      label: "This week spent",
      ...SPENDING_CHART_DATA.week,
    },
    month: {
      spent: selectedPeriod === "month" ? (summary?.totalSpent || 0) : 0,
      avgPerDay: selectedPeriod === "month" ? (summary?.avgPerDay || 0) : 0,
      label: "This month spent",
      ...SPENDING_CHART_DATA.month,
    },
    "3m": {
      spent: selectedPeriod === "3m" ? (summary?.totalSpent || 0) : 0,
      avgPerDay: selectedPeriod === "3m" ? (summary?.avgPerDay || 0) : 0,
      label: "Last 3 months spent",
      ...SPENDING_CHART_DATA["3m"],
    },
  };

  const handleScan = () => {
    router.push("/(protected)/scan-qr");
  };

  const handleLoadMoney = () => {
    router.push("/(protected)/load-money");
  };

  const handleAddToSavings = () => {
    if (!featuredGoal) {
      router.push("/(protected)/(tabs)/goals");
      return;
    }
    router.push("/(protected)/transfer-money");
  };

  const handleEnterArcade = () => {
    router.push("/(protected)/(tabs)/arcade");
  };

  const handleAvatarPress = () => {
    router.push("/(protected)/profile");
  };

  // Show loading state
  if (userLoading || walletsLoading) {
    return (
      <View className="flex-1 bg-background-dark items-center justify-center">
        <ActivityIndicator size="large" color="#FF8C32" />
        <Text className="text-white mt-4">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-dark">
      {/* Header - sticky */}
      <PageHeader
        title="Home"
        showAvatar
        userName={user?.name || "User"}
        userLevel={user?.level || 1}
        avatarUrl={getFullAvatarUrl(user?.avatarUrl) || undefined}
        coins={user?.coins || 0}
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
        {/* PallyTip */}
        <PallyTip message="Small saves beat big regrets. Let's go!" />

        {/* KYC Banner */}
        {!user?.kycCompleted && (
          <TouchableOpacity 
            onPress={() => router.push("/(protected)/full-kyc-benefits")}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["rgba(255, 140, 50, 0.15)", "rgba(255, 140, 50, 0.05)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(255, 140, 50, 0.3)"
              }}
            >
              <View style={{ 
                width: 40, height: 40, borderRadius: 20, 
                backgroundColor: "rgba(255, 140, 50, 0.2)", 
                alignItems: "center", justifyContent: "center", marginRight: 12 
              }}>
                <MaterialIcons name="verified-user" size={20} color="#FF8C32" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>Complete Verification</Text>
                <Text style={{ color: "#B0B0C3", fontSize: 12 }}>Unlock higher limits & exclusive badges</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#FF8C32" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Weekly Saving Goal */}
        <WeeklySavingGoal
          currentAmount={wallets?.savings?.balance || 0}
          targetAmount={featuredGoal?.targetAmount || 0}
          status={!featuredGoal ? "no-goal" : "on-track"}
          todaySaved={0}
        />

        {/* Active Split Groups */}
        <ActiveSplitGroups />

        {/* Prediction */}
        <PredictionCard
          category="Food"
          prediction="is projected to be 15% higher this weekend."
        />

        {/* Spending Overview */}
        <SpendingOverview
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          data={spendingData}
        />

        {/* Expense Wallet (Primary) */}
        <ExpenseWallet
          balance={wallets?.primary?.balance || 0}
          categories={(categories || []).slice(0, 3).map(c => ({ id: c._id, name: c.name, emoji: c.emoji }))}
          onScan={handleScan}
          onLoadMoney={handleLoadMoney}
        />

        {/* Savings Wallet */}
        <SavingsWallet
          balance={wallets?.savings?.balance || 0}
          goalName={featuredGoal?.name || "Make your first goal"}
          goalEmoji={featuredGoal?.emoji || "🎯"}
          targetAmount={featuredGoal?.targetAmount || 0}
          onAddToSavings={handleAddToSavings}
          hasGoal={!!featuredGoal}
        />

        {/* Arcade Teaser */}
        <ArcadeTeaser onEnterArcade={handleEnterArcade} />
      </ScrollView>
    </View>
  );
}
