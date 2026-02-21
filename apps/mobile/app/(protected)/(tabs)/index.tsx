import { useState, useCallback } from "react";
import {
  ScrollView,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

import { PageHeader } from "../../../components/ui/PageHeader";
import { PallyTip } from "../../../components/dashboard/PallyTip";
import { WeeklySavingGoal } from "../../../components/dashboard/WeeklySavingGoal";
import { SpendingOverview } from "../../../components/dashboard/SpendingOverview";
import { ExpenseWallet } from "../../../components/dashboard/ExpenseWallet";
import { SavingsWallet } from "../../../components/dashboard/SavingsWallet";
import { ArcadeTeaser } from "../../../components/dashboard/ArcadeTeaser";
import { ActiveSplitGroups } from "../../../components/dashboard/ActiveSplitGroups";
import {
  getFullAvatarUrl,
} from "../../../hooks/useApi";
import { useDashboard } from "../../../hooks/useDashboard";

// Keep labels static, but do not fake trend lines when there is no data.
const SPENDING_CHART_META = {
  week: {
    xLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  month: {
    xLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
  },
  "3m": {
    xLabels: ["Nov", "Dec", "Jan"],
  },
};

type ChartShape = {
  chartPath: string;
  chartFillPath: string;
  chartEndX: number;
  chartEndY: number;
};

const buildChartShape = (pointsInput: number[] | undefined): ChartShape => {
  const points = pointsInput && pointsInput.length > 0 ? pointsInput : [0, 0];
  const safePoints = points.map((value) =>
    Number.isFinite(value) ? Math.max(0, value) : 0
  );

  const bottomY = 44;
  const topY = 10;
  const maxValue = Math.max(...safePoints, 0);
  const yRange = bottomY - topY;
  const xStep = safePoints.length > 1 ? 100 / (safePoints.length - 1) : 100;

  const coords = safePoints.map((value, idx) => {
    const normalized = maxValue > 0 ? value / maxValue : 0;
    return {
      x: Number((idx * xStep).toFixed(2)),
      y: Number((bottomY - normalized * yRange).toFixed(2)),
    };
  });

  const chartPath = coords
    .map((point, idx) => `${idx === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
  const chartFillPath = `${chartPath} V 50 H 0 Z`;
  const endPoint = coords[coords.length - 1] || { x: 100, y: bottomY };

  return {
    chartPath: chartPath || "M0 44 L100 44",
    chartFillPath: chartFillPath || "M0 44 L100 44 V 50 H 0 Z",
    chartEndX: endPoint.x,
    chartEndY: endPoint.y,
  };
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "3m">(
    "week",
  );

  // API hooks
  const { dashboard, loading, refetch } = useDashboard();

  const user = dashboard?.user;
  const wallets = dashboard?.wallets;
  const categories = dashboard?.categories;
  const goals = dashboard?.goals;
  const weekSummary = dashboard?.spendingSummary?.week;
  const monthSummary = dashboard?.spendingSummary?.month;
  const threeMonthSummary = dashboard?.spendingSummary?.["3m"];

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Get featured goal for savings widget
  const featuredGoal = goals?.find((g) => g.isFeatured) || goals?.[0];

  const weekChart = buildChartShape(weekSummary?.chartPoints);
  const monthChart = buildChartShape(monthSummary?.chartPoints);
  const threeMonthChart = buildChartShape(threeMonthSummary?.chartPoints);

  // Build spending data from API
  const spendingData = {
    week: {
      spent: weekSummary?.totalSpent || 0,
      avgPerDay: weekSummary?.avgPerDay || 0,
      label: "This week spent",
      chartPath: weekChart.chartPath,
      chartFillPath: weekChart.chartFillPath,
      chartPoints: weekSummary?.chartPoints || [],
      chartEndX: weekChart.chartEndX,
      chartEndY: weekChart.chartEndY,
      xLabels: weekSummary?.chartLabels || SPENDING_CHART_META.week.xLabels,
    },
    month: {
      spent: monthSummary?.totalSpent || 0,
      avgPerDay: monthSummary?.avgPerDay || 0,
      label: "This month spent",
      chartPath: monthChart.chartPath,
      chartFillPath: monthChart.chartFillPath,
      chartPoints: monthSummary?.chartPoints || [],
      chartEndX: monthChart.chartEndX,
      chartEndY: monthChart.chartEndY,
      xLabels: monthSummary?.chartLabels || SPENDING_CHART_META.month.xLabels,
    },
    "3m": {
      spent: threeMonthSummary?.totalSpent || 0,
      avgPerDay: threeMonthSummary?.avgPerDay || 0,
      label: "Last 3 months spent",
      chartPath: threeMonthChart.chartPath,
      chartFillPath: threeMonthChart.chartFillPath,
      chartPoints: threeMonthSummary?.chartPoints || [],
      chartEndX: threeMonthChart.chartEndX,
      chartEndY: threeMonthChart.chartEndY,
      xLabels: threeMonthSummary?.chartLabels || SPENDING_CHART_META["3m"].xLabels,
    },
  };

  const handleGoToExpenseWallet = () => {
    router.push("/(protected)/(tabs)/wallets");
  };

  const handleGoToSavings = () => {
    router.push("/(protected)/(tabs)/goals");
  };

  const handleEnterArcade = () => {
    router.push("/(protected)/(tabs)/arcade");
  };

  const handleAvatarPress = () => {
    router.push("/(protected)/profile");
  };

  // Show loading state
  if (loading && !dashboard) {
    return (
      <View className="flex-1 items-center justify-center bg-background-dark">
        <ActivityIndicator size="large" color="#FF8C32" />
        <Text className="mt-4 text-white">Loading...</Text>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF8C32"
          />
        }
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
                borderColor: "rgba(255, 140, 50, 0.3)",
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255, 140, 50, 0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <MaterialIcons name="verified-user" size={20} color="#FF8C32" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}
                >
                  Complete Verification
                </Text>
                <Text style={{ color: "#B0B0C3", fontSize: 12 }}>
                  Unlock higher limits & exclusive badges
                </Text>
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
          todaySaved={undefined}
        />

        {/* Active Split Groups */}
        <ActiveSplitGroups />

        {/* Spending Overview */}
        <SpendingOverview
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          data={spendingData}
        />

        {/* Expense Wallet (Primary) */}
        <ExpenseWallet
          balance={wallets?.primary?.balance || 0}
          categories={(categories || [])
            .slice(0, 3)
            .map((c) => ({ id: c.id, name: c.name, emoji: c.emoji }))}
          onGoTo={handleGoToExpenseWallet}
        />

        {/* Savings Wallet */}
        <SavingsWallet
          balance={wallets?.savings?.balance || 0}
          goalName={featuredGoal?.name || "Make your first goal"}
          goalEmoji={featuredGoal?.emoji || "🎯"}
          targetAmount={featuredGoal?.targetAmount || 0}
          onGoTo={handleGoToSavings}
          hasGoal={!!featuredGoal}
        />

        {/* Arcade Teaser */}
        <ArcadeTeaser onEnterArcade={handleEnterArcade} />
      </ScrollView>
    </View>
  );
}
