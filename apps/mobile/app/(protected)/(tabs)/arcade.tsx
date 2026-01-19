import { useState, useCallback } from "react";
import { ScrollView, View, Text, ActivityIndicator, TouchableOpacity, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { PageHeader } from "../../../components/ui/PageHeader";
import { ArcadeWelcome } from "../../../components/arcade/ArcadeWelcome";
import { StreakArena } from "../../../components/arcade/StreakArena";
import { BossBattles } from "../../../components/arcade/BossBattles";
import { NoSpendQuests } from "../../../components/arcade/NoSpendQuests";
import { SavingsWheel } from "../../../components/arcade/SavingsWheel";
import { useUser, useBoss, useQuests, useFriends } from "../../../hooks/useApi";

export default function ArcadeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Use real data from backend (cached via React Query)
  const { user, refetch: refetchUser } = useUser();
  const { boss, loading: bossLoading, refetch: refetchBoss } = useBoss();
  const { quests, loading: questsLoading, assignQuests, refetch: refetchQuests } = useQuests();
  const { friends, pendingRequests, refetchFriends } = useFriends();

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchUser(), refetchBoss(), refetchQuests(), refetchFriends()]);
    setRefreshing(false);
  }, [refetchUser, refetchBoss, refetchQuests, refetchFriends]);

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

  const handleFriendsPress = () => {
    router.push("/(protected)/friends");
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF8C32" />}
      >
        {/* Welcome */}
        <ArcadeWelcome />

        {/* Friends Card */}
        <TouchableOpacity
          onPress={handleFriendsPress}
          activeOpacity={0.8}
          className="bg-surface-dark rounded-2xl p-4 border border-white/5"
        >
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mr-4">
              <Text className="text-2xl">👥</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-lg">Friends</Text>
              <Text className="text-text-muted text-sm">
                {friends.length} friends • {pendingRequests.length} pending
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#6B6B7B" />
          </View>
        </TouchableOpacity>

        {/* Badges Card */}
        <TouchableOpacity
          onPress={() => router.push("/(protected)/badges")}
          activeOpacity={0.8}
          className="bg-surface-dark rounded-2xl p-4 border border-white/5"
        >
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-yellow-500/20 items-center justify-center mr-4">
              <Text className="text-2xl">🏆</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-lg">Badges</Text>
              <Text className="text-text-muted text-sm">
                Collect achievements
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#6B6B7B" />
          </View>
        </TouchableOpacity>

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
