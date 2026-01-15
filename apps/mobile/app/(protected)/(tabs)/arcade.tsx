import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { PageHeader } from "../../../components/ui/PageHeader";
import { ArcadeWelcome } from "../../../components/arcade/ArcadeWelcome";
import { StreakArena } from "../../../components/arcade/StreakArena";
import { BossBattles } from "../../../components/arcade/BossBattles";
import { NoSpendQuests } from "../../../components/arcade/NoSpendQuests";
import { SavingsWheel } from "../../../components/arcade/SavingsWheel";

// Mock data
const MOCK_BOSSES = [
  {
    id: "1",
    name: "Food Beast",
    emoji: "🍔",
    type: "BOSS" as const,
    weakness: "Home Cooking",
    hpPercent: 60,
  },
  {
    id: "2",
    name: "Cab Demon",
    emoji: "🚕",
    type: "MINION" as const,
    weakness: "Walking",
    hpPercent: 100,
  },
];

const MOCK_QUESTS = [
  {
    id: "1",
    name: "Swiggy Shield",
    description: "Don't order for 3 days",
    icon: "restaurant-menu" as const,
    iconColor: "#FF8C32",
  },
  {
    id: "2",
    name: "Cab Crusader",
    description: "Take metro 5 times",
    icon: "local-taxi" as const,
    iconColor: "#FFFFFF",
  },
];

export default function ArcadeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleSeeMap = () => {
    console.log("See map");
  };

  const handleStartQuest = (id: string) => {
    console.log("Start quest:", id);
  };

  const handleSpin = () => {
    router.push("/(protected)/savings-wheel");
  };

  const handleStreakPress = () => {
    router.push("/(protected)/streak-arena");
  };

  const handleBossPress = (id: string) => {
    // In a real app, we'd pass the boss ID to load specific data
    // For now we just navigate to the template
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
        coins={1250}
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
        <BossBattles 
          bosses={MOCK_BOSSES} 
          onSeeMap={handleSeeMap} 
          onPressBoss={handleBossPress}
        />

        {/* No-Spend Quests */}
        <NoSpendQuests
          quests={MOCK_QUESTS}
          onStartQuest={handleStartQuest}
        />

        {/* Savings Wheel */}
        <SavingsWheel onSpin={handleSpin} />
      </ScrollView>
    </View>
  );
}

