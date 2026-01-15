import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

// Mock data
const MOCK_STREAK_DATA = {
  currentStreak: 5,
  bestStreak: 9,
  currentTier: "Bronze Saver",
  tierProgress: 60,
  daysToUpgrade: 3,
  tierReward: 100,
  shieldsAvailable: 1,
  weeklyProgress: [
    { day: "Mon", completed: true },
    { day: "Tue", completed: true },
    { day: "Wed", completed: true, isToday: true },
    { day: "Thu", completed: false },
    { day: "Fri", completed: false },
    { day: "Sat", completed: false },
  ],
  history: [
    { id: "1", days: 7, endedAgo: "2 days ago", coins: 350 },
    { id: "2", days: 3, endedAgo: "12 days ago", coins: 150 },
  ],
};

export default function StreakArenaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <MaterialIcons name="arrow-back" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Streak Arena</Text>
        </View>
        <View style={styles.coinsBadge}>
          <MaterialIcons name="monetization-on" size={14} color="#FFD166" />
          <Text style={styles.coinsText}>1,250</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.fireGlow} />
          <View style={styles.fireContainer}>
            <MaterialIcons
              name="local-fire-department"
              size={100}
              color="#FF8C32"
              style={styles.fireIcon}
            />
          </View>
          <Text style={styles.streakTitle}>
            {MOCK_STREAK_DATA.currentStreak} Day{" "}
            <Text style={styles.streakHighlight}>Streak</Text>
          </Text>
          <View style={styles.bestBadge}>
            <Text style={styles.trophyEmoji}>🏆</Text>
            <Text style={styles.bestText}>
              Best: <Text style={styles.bestValue}>{MOCK_STREAK_DATA.bestStreak} days</Text>
            </Text>
          </View>
        </View>

        {/* Weekly Progress */}
        <View style={styles.weeklyCard}>
          {MOCK_STREAK_DATA.weeklyProgress.map((day, idx) => (
            <View key={day.day} style={styles.dayColumn}>
              <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
                {day.day}
              </Text>
              <View
                style={[
                  styles.dayCircle,
                  day.completed && styles.dayCircleCompleted,
                  !day.completed && styles.dayCircleEmpty,
                  day.isToday && styles.dayCircleToday,
                ]}
              >
                {day.completed && (
                  <MaterialIcons name="check" size={16} color="#FFFFFF" />
                )}
              </View>
              {idx < MOCK_STREAK_DATA.weeklyProgress.length - 1 && (
                <View
                  style={[
                    styles.dayConnector,
                    day.completed && styles.dayConnectorActive,
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        {/* Tier Progress Card */}
        <View style={styles.tierCard}>
          <View style={styles.tierCardGlow} />
          <View style={styles.tierHeader}>
            <View>
              <Text style={styles.tierLabel}>CURRENT TIER</Text>
              <Text style={styles.tierName}>{MOCK_STREAK_DATA.currentTier}</Text>
            </View>
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardEmoji}>🎁</Text>
              <Text style={styles.rewardText}>+{MOCK_STREAK_DATA.tierReward} coins</Text>
            </View>
          </View>

          <View style={styles.tierProgressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>PROGRESS</Text>
              <Text style={styles.progressPercent}>{MOCK_STREAK_DATA.tierProgress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${MOCK_STREAK_DATA.tierProgress}%` },
                ]}
              />
            </View>
            <Text style={styles.tierHint}>
              Keep your streak for {MOCK_STREAK_DATA.daysToUpgrade} more days to upgrade!
            </Text>
          </View>
        </View>

        {/* Power-ups Grid */}
        <View style={styles.powerupsGrid}>
          {/* Streak Shield */}
          <View style={styles.powerupCard}>
            <View style={styles.powerupHeader}>
              <View style={[styles.powerupIcon, { backgroundColor: "rgba(59, 130, 246, 0.1)", borderColor: "rgba(59, 130, 246, 0.2)" }]}>
                <Text style={styles.powerupEmoji}>🛡️</Text>
              </View>
              <View style={styles.availableBadge}>
                <Text style={styles.availableText}>{MOCK_STREAK_DATA.shieldsAvailable} Available</Text>
              </View>
            </View>
            <Text style={styles.powerupTitle}>Streak Shield</Text>
            <Text style={styles.powerupDesc}>Protect your streak if you miss a day.</Text>
            <View style={styles.pallyTip}>
              <Text style={styles.pallyEmoji}>🐿️</Text>
              <Text style={styles.pallyText}>"Even squirrels slip sometimes!"</Text>
            </View>
          </View>

          {/* Boost Rewards */}
          <View style={styles.powerupCard}>
            <View style={styles.powerupHeader}>
              <View style={[styles.powerupIcon, { backgroundColor: "rgba(168, 85, 247, 0.1)", borderColor: "rgba(168, 85, 247, 0.2)" }]}>
                <MaterialIcons name="rocket-launch" size={20} color="#A855F7" />
              </View>
            </View>
            <Text style={styles.powerupTitle}>Boost Rewards</Text>
            <Text style={styles.powerupDesc}>
              Get <Text style={styles.highlight}>1.5x coins</Text> for next 24h.
            </Text>
            <TouchableOpacity style={styles.buyButton}>
              <Text style={styles.buyButtonText}>50</Text>
              <Text style={styles.buyButtonEmoji}>🪙</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Streak History */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Streak History</Text>
          {MOCK_STREAK_DATA.history.map((item, idx) => (
            <View
              key={item.id}
              style={[styles.historyItem, idx > 0 && styles.historyItemFaded]}
            >
              <View style={styles.historyLeft}>
                <View style={styles.historyIcon}>
                  <MaterialIcons name="history" size={20} color="#B0B0C3" />
                </View>
                <View>
                  <Text style={styles.historyDays}>{item.days} Days Streak</Text>
                  <Text style={styles.historyEnded}>Ended {item.endedAgo}</Text>
                </View>
              </View>
              <Text style={styles.historyCoins}>+{item.coins} 🪙</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F14",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "rgba(15, 15, 20, 0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A1A22",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  coinsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1A1A22",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  coinsEmoji: {
    fontSize: 14,
  },
  coinsText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 24,
    paddingTop: 8,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 16,
  },
  fireGlow: {
    position: "absolute",
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: "rgba(255, 140, 50, 0.2)",
    top: 0,
  },
  fireContainer: {
    marginBottom: 16,
  },
  fireIcon: {
    textShadowColor: "rgba(255, 140, 50, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
  },
  streakTitle: {
    fontSize: 32,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  streakHighlight: {
    color: "#FF8C32",
  },
  bestBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(26, 26, 34, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginTop: 12,
  },
  trophyEmoji: {
    fontSize: 14,
  },
  bestText: {
    color: "#B0B0C3",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bestValue: {
    color: "#FFFFFF",
  },
  weeklyCard: {
    backgroundColor: "#1A1A22",
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  dayColumn: {
    alignItems: "center",
    gap: 8,
  },
  dayLabel: {
    color: "#B0B0C3",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  dayLabelToday: {
    color: "#FFFFFF",
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleCompleted: {
    backgroundColor: "#FF8C32",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 5,
  },
  dayCircleEmpty: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    opacity: 0.5,
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: "rgba(255, 140, 50, 0.3)",
  },
  dayConnector: {
    position: "absolute",
    right: -16,
    top: 32,
    width: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  dayConnectorActive: {
    backgroundColor: "rgba(255, 140, 50, 0.3)",
  },
  tierCard: {
    backgroundColor: "#1A1A22",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  tierCardGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(255, 140, 50, 0.05)",
  },
  tierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  tierLabel: {
    color: "#B0B0C3",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tierName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  rewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0F0F14",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  rewardEmoji: {
    fontSize: 12,
  },
  rewardText: {
    color: "#FF8C32",
    fontSize: 10,
    fontWeight: "700",
  },
  tierProgressSection: {},
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    color: "#B0B0C3",
    fontSize: 10,
    fontWeight: "700",
  },
  progressPercent: {
    color: "#FF8C32",
    fontSize: 10,
    fontWeight: "700",
  },
  progressBar: {
    height: 12,
    backgroundColor: "#0F0F14",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FF8C32",
    borderRadius: 6,
  },
  tierHint: {
    color: "#B0B0C3",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 10,
  },
  powerupsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  powerupCard: {
    flex: 1,
    backgroundColor: "#1A1A22",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    gap: 12,
  },
  powerupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  powerupIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  powerupEmoji: {
    fontSize: 20,
  },
  availableBadge: {
    backgroundColor: "rgba(61, 220, 151, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(61, 220, 151, 0.2)",
  },
  availableText: {
    color: "#3DDC97",
    fontSize: 9,
    fontWeight: "700",
  },
  powerupTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  powerupDesc: {
    color: "#B0B0C3",
    fontSize: 10,
    lineHeight: 14,
  },
  highlight: {
    color: "#FF8C32",
    fontWeight: "700",
  },
  pallyTip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#2A2A35",
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  pallyEmoji: {
    fontSize: 14,
  },
  pallyText: {
    flex: 1,
    color: "#B0B0C3",
    fontSize: 9,
    fontStyle: "italic",
    lineHeight: 12,
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  buyButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  buyButtonEmoji: {
    fontSize: 12,
  },
  historySection: {
    gap: 12,
  },
  historyTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A1A22",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  historyItemFaded: {
    opacity: 0.6,
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  historyDays: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  historyEnded: {
    color: "#B0B0C3",
    fontSize: 10,
    marginTop: 2,
  },
  historyCoins: {
    color: "#FF8C32",
    fontSize: 12,
    fontWeight: "700",
  },
});
