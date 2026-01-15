import { ScrollView, View, Text, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { PageHeader } from "../../../components/ui/PageHeader";
import { ArcadeWelcome } from "../../../components/arcade/ArcadeWelcome";
import { StreakArena } from "../../../components/arcade/StreakArena";
import { BossBattles } from "../../../components/arcade/BossBattles";
import { NoSpendQuests } from "../../../components/arcade/NoSpendQuests";
import { SavingsWheel } from "../../../components/arcade/SavingsWheel";
import { useUser, useBoss, useQuests } from "../../../hooks/useApi";

export default function ArcadeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Use real data from backend (cached via React Query)
  const { user } = useUser();
  const { boss, loading: bossLoading } = useBoss();
  const { quests, loading: questsLoading, assignQuests } = useQuests();

  // Transform boss data for BossBattles component
  const bossesForDisplay = boss ? [{
    id: boss._id,
    name: boss.name,
    emoji: boss.emoji || "🍔",
    type: "BOSS" as const,
    weakness: boss.description,
    hpPercent: Math.round((boss.currentHealth / boss.totalHealth) * 100),
  }] : [];

  // Transform quests for NoSpendQuests component
  const questsForDisplay = quests.map(q => ({
    id: q._id,
    name: q.title,
    description: q.description,
    icon: q.type === "savings" ? "savings" as const : "restaurant-menu" as const,
    iconColor: q.completed ? "#3DDC97" : "#FF8C32",
    progress: q.progress,
    target: q.requirement.target,
    completed: q.completed,
  }));

  const handleSeeMap = () => {
    console.log("See map");
  };

  const handleStartQuest = async (id: string) => {
    // Quest is already assigned, this could open quest details
    console.log("Quest clicked:", id);
  };

  const handleSpin = () => {
    router.push("/(protected)/savings-wheel");
  };

  const handleStreakPress = () => {
    router.push("/(protected)/streak-arena");
  };

  const handleBossPress = (id: string) => {
    router.push({
      pathname: "/(protected)/boss-battle",
      params: { id }
    });
  };

  return (
    <View className="flex-1 bg-background-dark">
      <PageHeader
        title="Arcade"
        seasonBadge="SEASON 1"
        coins={user?.coins || 0}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120 + insets.bottom,
          gap: 24,
          paddingTop: 4,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome */}
        <ArcadeWelcome />

        {/* Streak Arena */}
        <StreakArena
          currentStreak={5}
          nextRewardDays={2}
          totalDays={7}
          onPress={handleStreakPress}
        />

        {/* Boss Battles */}
        {bossLoading ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <ActivityIndicator color="#FF8C32" />
          </View>
        ) : bossesForDisplay.length > 0 ? (
          <BossBattles 
            bosses={bossesForDisplay} 
            onSeeMap={handleSeeMap} 
            onPressBoss={handleBossPress}
          />
        ) : (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: "#B0B0C3" }}>No active boss battles</Text>
          </View>
        )}

        {/* No-Spend Quests */}
        {questsLoading ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <ActivityIndicator color="#FF8C32" />
          </View>
        ) : questsForDisplay.length > 0 ? (
          <NoSpendQuests
            quests={questsForDisplay}
            onStartQuest={handleStartQuest}
          />
        ) : (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: "#B0B0C3" }}>No quests available</Text>
          </View>
        )}

        {/* Savings Wheel */}
        <SavingsWheel onSpin={handleSpin} />
      </ScrollView>
    </View>
  );
}
