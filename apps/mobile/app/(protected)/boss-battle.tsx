import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";

// Boss type definition
interface BossData {
  id: string;
  name: string;
  title: string;
  emoji: string;
  sidekickEmoji?: string;
  color: string;
  currentHp: number;
  maxHp: number;
  todayChallenge: string;
  challengeDescription: string;
  timeRemaining: string;
  activeHeroes: number;
}

// Default boss data (Food Beast)
const DEFAULT_BOSS: BossData = {
  id: "food-beast",
  name: "THE FOOD",
  title: "BEAST",
  emoji: "🍔",
  sidekickEmoji: "🍟",
  color: "#EF4444",
  currentHp: 12450,
  maxHp: 50000,
  todayChallenge: "Community Raid: No Delivery",
  challengeDescription: "Server-wide Event: Every skipped meal deals massive damage together!",
  timeRemaining: "04:23:10",
  activeHeroes: 324,
};

// Battle log type
interface BattleLogEntry {
  id: string;
  user: string;
  action: string;
  timeAgo: string;
  damage: number;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

const MOCK_COMMUNITY_LOG: BattleLogEntry[] = [
  { id: "1", user: "Harsh", action: "Skipped Zomato", timeAgo: "2m", damage: 150, icon: "restaurant-menu", color: "#EF4444" },
  { id: "2", user: "Sarah", action: "Cooked Lunch", timeAgo: "5m", damage: 120, icon: "soup-kitchen", color: "#3DDC97" },
  { id: "3", user: "Mike", action: "Walked Home", timeAgo: "12m", damage: 100, icon: "directions-walk", color: "#FFA24C" },
  { id: "4", user: "You", action: "Skipped Swiggy", timeAgo: "15m", damage: 150, icon: "takeout-dining", color: "#EF4444" },
];

// Leaderboard type
interface LeaderboardEntry {
  id: string;
  rank: number;
  user: string;
  damage: number;
  avatar: string;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: "1", rank: 1, user: "Alex W.", damage: 2450, avatar: "🦸‍♂️" },
  { id: "2", rank: 2, user: "Sarah J.", damage: 2100, avatar: "🧝‍♀️" },
  { id: "3", rank: 3, user: "Mike T.", damage: 1950, avatar: "🧙‍♂️" },
];

export default function BossBattleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Get boss data from params or use default
  const boss = DEFAULT_BOSS;
  const hpPercent = (boss.currentHp / boss.maxHp) * 100;

  useEffect(() => {
    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -15,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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
          <Text style={styles.headerTitle}>Boss Raid</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{boss.activeHeroes} Fighting</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Boss Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.heroGlow, { backgroundColor: `${boss.color}15` }]} />

          {/* Boss with sidekicks */}
          <View style={styles.bossContainer}>
            {/* Left sidekick */}
            {boss.sidekickEmoji && (
              <Animated.View
                style={[
                  styles.sidekick,
                  styles.sidekickLeft,
                  { transform: [{ translateY: floatAnim }, { rotate: "-25deg" }] },
                ]}
              >
                <Text style={styles.sidekickEmoji}>{boss.sidekickEmoji}</Text>
              </Animated.View>
            )}

            {/* Main boss */}
            <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
              <Text style={styles.bossEmoji}>{boss.emoji}</Text>
            </Animated.View>

            {/* Right sidekick */}
            {boss.sidekickEmoji && (
              <Animated.View
                style={[
                  styles.sidekick,
                  styles.sidekickRight,
                  { transform: [{ translateY: floatAnim }, { rotate: "25deg" }] },
                ]}
              >
                <Text style={styles.sidekickEmoji}>{boss.sidekickEmoji}</Text>
              </Animated.View>
            )}
          </View>

          {/* Boss name */}
          <Text style={styles.bossName}>
            {boss.name} <Text style={{ color: boss.color }}>{boss.title}</Text>
          </Text>

          {/* HP Bar */}
          <View style={styles.hpContainer}>
            <View style={styles.hpLabelRow}>
              <Text style={[styles.hpLabel, { color: boss.color }]}>RAID PROGRESS</Text>
              <Text style={[styles.hpLabel, { color: boss.color }]}>
                {(boss.maxHp - boss.currentHp).toLocaleString()} / {boss.maxHp.toLocaleString()} HP
              </Text>
            </View>
            <View style={styles.hpBar}>
              <View
                style={[
                  styles.hpFill,
                  { width: `${100 - hpPercent}%`, backgroundColor: boss.color },
                ]}
              >
                <View style={styles.hpStripes} />
              </View>
            </View>
          </View>
        </View>

        {/* Community Challenge */}
        <View style={styles.challengeCard}>
          <View style={styles.challengeCardGlow} />
          <View style={styles.challengeHeader}>
            <View>
              <View style={styles.challengeLabelRow}>
                <MaterialIcons name="groups" size={14} color="#FF8C32" />
                <Text style={styles.challengeLabel}>COMMUNITY GOAL</Text>
              </View>
              <Text style={styles.challengeTitle}>{boss.todayChallenge}</Text>
            </View>
            <View style={styles.timerBadge}>
              <Text style={styles.timerLabel}>ENDS IN</Text>
              <Text style={styles.timerValue}>{boss.timeRemaining}</Text>
            </View>
          </View>
          <Text style={styles.challengeDesc}>{boss.challengeDescription}</Text>
          
          <TouchableOpacity style={styles.joinRaidButton}>
            <Text style={styles.joinRaidText}>Join Raid</Text>
            <MaterialIcons name="login" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Top Heroes Leaderboard */}
        <View style={styles.battleLogSection}>
           <View style={styles.battleLogHeader}>
            <MaterialIcons name="leaderboard" size={18} color="#FFD166" />
            <Text style={styles.battleLogTitle}>Top Heroes</Text>
          </View>
          
          {MOCK_LEADERBOARD.map((entry) => (
             <View key={entry.id} style={styles.leaderboardItem}>
                <View style={styles.leaderboardLeft}>
                   <View style={[
                       styles.rankBadge, 
                       entry.rank === 1 ? styles.rank1 : 
                       entry.rank === 2 ? styles.rank2 : styles.rank3
                   ]}>
                      <Text style={styles.rankText}>#{entry.rank}</Text>
                   </View>
                   <Text style={styles.avatarEmoji}>{entry.avatar}</Text>
                   <Text style={styles.leaderboardUser}>{entry.user}</Text>
                </View>
                <View style={styles.leaderboardRight}>
                    <Text style={styles.leaderboardDamage}>{entry.damage} HP</Text>
                    <MaterialIcons name="flash-on" size={12} color="#EF4444" />
                </View>
             </View>
          ))}
        </View>

        {/* Community Activity Log */}
        <View style={styles.battleLogSection}>
          <View style={styles.battleLogHeader}>
            <MaterialIcons name="public" size={18} color="#B0B0C3" />
            <Text style={styles.battleLogTitle}>Live Battle Feed</Text>
          </View>

          {MOCK_COMMUNITY_LOG.map((entry) => (
            <View key={entry.id} style={styles.logItem}>
              <View style={styles.logLeft}>
                <View style={[styles.logIcon, { backgroundColor: `${entry.color}15`, borderColor: `${entry.color}30` }]}>
                  <MaterialIcons name={entry.icon} size={18} color={entry.color} />
                </View>
                <View>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                     <Text style={styles.logUser}>{entry.user}</Text>
                     <Text style={styles.logTime}>{entry.timeAgo}</Text>
                  </View>
                  <Text style={styles.logAction}>{entry.action}</Text>
                </View>
              </View>
              <View style={styles.logRight}>
                <View style={styles.damageRow}>
                  <MaterialIcons name="flash-on" size={12} color="#EF4444" />
                  <Text style={styles.damageText}>-{entry.damage}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Pally Tip - Now scrollable */}
        <View style={styles.pallyTipContainer}>
          <LinearGradient
            colors={["#2A2A35", "#1A1A22"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.pallyTipGradient}
          >
            <View style={styles.pallyTipContent}>
              <View style={styles.pallyIconContainer}>
                <Text style={styles.pallyIcon}>🐿️</Text>
              </View>
              <View style={styles.pallyTextContainer}>
                <Text style={styles.pallyLabel}>RAID STRATEGY</Text>
                <Text style={styles.pallyMessage}>
                  We need 50 more people to skip lunch orders to defeat this boss today!
                </Text>
              </View>
            </View>
          </LinearGradient>
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
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
  },
  liveText: {
    color: "#EF4444",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 24,
    paddingTop: 16,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  heroGlow: {
    position: "absolute",
    width: 256,
    height: 256,
    borderRadius: 128,
    top: 0,
  },
  bossContainer: {
    width: 192,
    height: 192,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  bossEmoji: {
    fontSize: 96,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 15 },
    textShadowRadius: 30,
  },
  sidekick: {
    position: "absolute",
  },
  sidekickLeft: {
    left: -8,
    top: 64,
  },
  sidekickRight: {
    right: -8,
    top: 64,
  },
  sidekickEmoji: {
    fontSize: 48,
    opacity: 0.9,
  },
  bossName: {
    fontSize: 28,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#FFFFFF",
    letterSpacing: -1,
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  hpContainer: {
    width: "100%",
    maxWidth: 280,
    marginTop: 8,
  },
  hpLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  hpLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hpBar: {
    height: 20,
    backgroundColor: "#1A1A22",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  hpFill: {
    height: "100%",
    borderRadius: 10,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 5,
  },
  hpStripes: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  challengeCard: {
    backgroundColor: "#1A1A22",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
  },
  challengeCardGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(255, 140, 50, 0.1)",
  },
  challengeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  challengeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  challengeLabel: {
    color: "#FF8C32",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  challengeTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  timerBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "flex-end",
  },
  timerLabel: {
    color: "#B0B0C3",
    fontSize: 9,
    fontWeight: "700",
    marginBottom: 2,
  },
  timerValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  challengeDesc: {
    color: "#B0B0C3",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  joinRaidButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  joinRaidText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  battleLogSection: {
    gap: 12,
  },
  battleLogHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  battleLogTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  logItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A1A22",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  logLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  logUser: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  logTime: {
    color: "#B0B0C3",
    fontSize: 10,
  },
  logAction: {
    color: "#B0B0C3",
    fontSize: 11,
  },
  logRight: {
    alignItems: "flex-end",
  },
  damageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  damageText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "700",
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A1A22",
    padding: 12,
    borderRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  leaderboardLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
  },
  rankBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.1)",
      alignItems: "center",
      justifyContent: "center",
  },
  rank1: { backgroundColor: "#FFD166" },
  rank2: { backgroundColor: "#C0C0C0" },
  rank3: { backgroundColor: "#CD7F32" },
  rankText: {
      color: "#0F0F14",
      fontSize: 10,
      fontWeight: "800",
  },
  avatarEmoji: {
      fontSize: 20,
  },
  leaderboardUser: {
      color: "#FFF",
      fontSize: 14,
      fontWeight: "600",
  },
  leaderboardRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
  },
  leaderboardDamage: {
      color: "#EF4444",
      fontSize: 12,
      fontWeight: "700",
  },
  pallyTipContainer: {
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 8,
  },
  pallyTipGradient: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  pallyTipContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  pallyIconContainer: {
    height: 40,
    width: 40,
    backgroundColor: "rgba(255, 140, 50, 0.2)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  pallyIcon: {
    fontSize: 20,
  },
  pallyTextContainer: {
    flex: 1,
  },
  pallyLabel: {
    color: "#FF8C32",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 2,
  },
  pallyMessage: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
});
