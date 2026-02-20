import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { useLeaderboard, useUser, getFullAvatarUrl } from "../../hooks/useApi";

type LeaderboardType = "coins" | "goals";

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();
  const [type, setType] = useState<LeaderboardType>("coins");
  const { leaderboard, loading, refetch } = useLeaderboard(type);

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  };

  const getMetricValue = (entry: (typeof leaderboard)[0]) => {
    return type === "coins" ? entry.coins : entry.totalGoalsCompleted;
  };

  const getMetricLabel = () => {
    return type === "coins" ? "coins" : "goals";
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leaderboard</Text>
        </View>
        <View style={styles.coinsBadge}>
          <MaterialIcons name="monetization-on" size={16} color="#FFD166" />
          <Text style={styles.coinsText}>
            {user?.coins?.toLocaleString() || 0}
          </Text>
        </View>
      </View>

      {/* Type Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          onPress={() => setType("coins")}
          style={[
            styles.toggleButton,
            type === "coins" && styles.toggleButtonActive,
          ]}
        >
          <Text style={styles.toggleEmoji}>💰</Text>
          <Text
            style={[
              styles.toggleText,
              type === "coins" && styles.toggleTextActive,
            ]}
          >
            Coins
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setType("goals")}
          style={[
            styles.toggleButton,
            type === "goals" && styles.toggleButtonActive,
          ]}
        >
          <Text style={styles.toggleEmoji}>🎯</Text>
          <Text
            style={[
              styles.toggleText,
              type === "goals" && styles.toggleTextActive,
            ]}
          >
            Goals
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom },
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
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color="#FF8C32" />
          </View>
        ) : leaderboard.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialIcons name="emoji-events" size={48} color="#6B6B7B" />
            <Text style={styles.emptyText}>
              Add friends to see the leaderboard!
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {leaderboard.map((entry) => (
              <View
                key={entry.id}
                style={[
                  styles.entryCard,
                  entry.isCurrentUser && styles.entryCardHighlight,
                ]}
              >
                {/* Rank */}
                <View style={styles.rankContainer}>
                  {getRankIcon(entry.rank) ? (
                    <Text style={styles.rankEmoji}>
                      {getRankIcon(entry.rank)}
                    </Text>
                  ) : (
                    <Text style={styles.rankNumber}>#{entry.rank}</Text>
                  )}
                </View>

                {/* Avatar */}
                <View style={styles.avatarContainer}>
                  {entry.avatarUrl ? (
                    <Image
                      source={{
                        uri: getFullAvatarUrl(entry.avatarUrl) || undefined,
                      }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarEmoji}>👤</Text>
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={styles.entryInfo}>
                  <View style={styles.nameRow}>
                    <Text
                      style={[
                        styles.entryName,
                        entry.isCurrentUser && styles.entryNameHighlight,
                      ]}
                    >
                      {entry.name}
                    </Text>
                    {entry.isCurrentUser && (
                      <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>You</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.entryLevel}>Level {entry.level}</Text>
                </View>

                {/* Score */}
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreValue}>
                    {getMetricValue(entry).toLocaleString()}
                  </Text>
                  <Text style={styles.scoreLabel}>{getMetricLabel()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A22",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
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
  },
  coinsText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  toggleContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#1A1A22",
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  toggleButtonActive: {
    backgroundColor: "#FF8C32",
  },
  toggleEmoji: {
    fontSize: 18,
  },
  toggleText: {
    color: "#6B6B7B",
    fontWeight: "600",
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  centerContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#6B6B7B",
    marginTop: 16,
  },
  listContainer: {
    gap: 12,
  },
  entryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A22",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  entryCardHighlight: {
    backgroundColor: "rgba(255,140,50,0.1)",
    borderColor: "rgba(255,140,50,0.3)",
  },
  rankContainer: {
    width: 40,
    alignItems: "center",
    marginRight: 12,
  },
  rankEmoji: {
    fontSize: 24,
  },
  rankNumber: {
    color: "#6B6B7B",
    fontSize: 16,
    fontWeight: "700",
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0F0F14",
    overflow: "hidden",
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 24,
  },
  entryInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  entryName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  entryNameHighlight: {
    color: "#FF8C32",
  },
  youBadge: {
    backgroundColor: "rgba(255,140,50,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youBadgeText: {
    color: "#FF8C32",
    fontSize: 10,
    fontWeight: "600",
  },
  entryLevel: {
    color: "#6B6B7B",
    fontSize: 13,
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: "flex-end",
  },
  scoreValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  scoreLabel: {
    color: "#6B6B7B",
    fontSize: 11,
  },
});
