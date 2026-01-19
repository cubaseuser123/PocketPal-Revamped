import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { PageHeader } from "../../../components/ui/PageHeader";
import { GoalPallyTip } from "../../../components/goals/GoalPallyTip";
import { FeaturedGoalCard } from "../../../components/goals/FeaturedGoalCard";
import { OtherGoalCard } from "../../../components/goals/OtherGoalCard";
import { SavingsGraph } from "../../../components/goals/SavingsGraph";
import { useGoals, useUser } from "../../../hooks/useApi";
import { useCustomAlert } from "../../../contexts/CustomAlertContext";

// Helper to format currency
const formatCurrency = (amount: number): string => {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}k`;
  return `₹${amount}`;
};

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { goals, loading, deleteGoal, refetch: refetchGoals } = useGoals();
  const { user } = useUser();
  const { showAlert } = useCustomAlert();

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchGoals();
    setRefreshing(false);
  }, [refetchGoals]);

  const handleAddGoal = () => {
    router.push("/(protected)/create-goal");
  };

  const handleDeleteGoal = (goalId: string, goalName: string) => {
    showAlert(
      "Delete Goal",
      `Are you sure you want to delete "${goalName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGoal(goalId);
              console.log("Goal deleted:", goalId);
            } catch (error) {
              console.error("Delete failed:", error);
              showAlert("Error", "Failed to delete goal");
            }
          },
        },
      ],
    );
  };

  const featuredGoal = goals?.find((g) => g.isFeatured);
  const otherGoals = goals?.filter((g) => !g.isFeatured) || [];

  // Custom add button for header
  const AddButton = (
    <TouchableOpacity
      style={styles.headerAddBtn}
      onPress={handleAddGoal}
      activeOpacity={0.8}
    >
      <MaterialIcons name="add" size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF8C32" />
        <Text style={styles.loadingText}>Loading goals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Goals"
        subtitle="What are you saving for?"
        coins={user?.coins || 0}
        rightContent={AddButton}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF8C32"
          />
        }
      >
        {/* Pally Tip */}
        <GoalPallyTip />

        {/* Savings Graph */}
        <SavingsGraph
          amount={goals?.reduce((acc, g) => acc + g.currentAmount, 0) || 0}
        />

        {/* Featured Goal */}
        {featuredGoal ? (
          <FeaturedGoalCard
            title={featuredGoal.name}
            category={featuredGoal.category}
            currentAmount={featuredGoal.currentAmount}
            targetAmount={featuredGoal.targetAmount}
            icon={featuredGoal.emoji}
            color={featuredGoal.color}
            progress={featuredGoal.progress}
            onAdd={() => {
              router.push({
                pathname: "/(protected)/goal-detail",
                params: { id: featuredGoal.id },
              });
            }}
            onView={() =>
              router.push({
                pathname: "/(protected)/goal-detail",
                params: { id: featuredGoal.id },
              })
            }
          />
        ) : (goals?.length || 0) > 0 ? (
          // Show first goal as featured if none marked
          <FeaturedGoalCard
            title={goals[0].name}
            category={goals[0].category}
            currentAmount={goals[0].currentAmount}
            targetAmount={goals[0].targetAmount}
            icon={goals[0].emoji}
            color={goals[0].color}
            progress={goals[0].progress}
            onAdd={() => console.log("Add to goal")}
            onView={() => console.log("View goal")}
          />
        ) : null}

        {/* Other Goals List */}
        {otherGoals.length > 0 && (
          <View style={styles.otherGoalsSection}>
            <Text style={styles.sectionTitle}>OTHER GOALS</Text>

            {otherGoals.map((goal) => (
              <OtherGoalCard
                key={goal.id}
                title={goal.name}
                currentAmount={formatCurrency(goal.currentAmount)}
                targetAmount={formatCurrency(goal.targetAmount)}
                icon={goal.emoji}
                color={goal.color}
                progress={goal.progress}
                onDelete={() => handleDeleteGoal(goal.id, goal.name)}
                onPress={() =>
                  router.push({
                    pathname: "/(protected)/goal-detail",
                    params: { id: goal.id },
                  })
                }
              />
            ))}
          </View>
        )}

        {/* Create New Goal Button */}
        <TouchableOpacity
          style={styles.createBtn}
          activeOpacity={0.9}
          onPress={handleAddGoal}
        >
          <View style={styles.createBtnIcon}>
            <MaterialIcons name="add" size={14} color="#FFF" />
          </View>
          <Text style={styles.createBtnText}>Create a New Goal</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F14",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 16,
  },
  headerAddBtn: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: "#FF8C32",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 24,
  },
  otherGoalsSection: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B0B0C3",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 4,
    marginBottom: 8,
  },
  createBtn: {
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderStyle: "dashed",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
  },
  createBtnIcon: {
    height: 24,
    width: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnText: {
    color: "#B0B0C3",
    fontSize: 12,
    fontWeight: "700",
  },
});
