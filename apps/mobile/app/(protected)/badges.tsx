import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { ScreenHeader } from "../../components/ui/ScreenHeader";

import { useBadges, useUser } from "../../hooks/useApi";

const CATEGORY_LABELS: Record<string, string> = {
  savings: "💰 Savings",
  social: "👥 Social",
  streaks: "🔥 Streaks",
  coins: "🏅 Coins",
};

export default function BadgesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();
  const { badges, earnedCount, totalCount, loading, refetch } = useBadges();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleBack = () => {
    router.back();
  };

  // Group badges by category
  const badgesByCategory = badges.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, typeof badges>);

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader
        title="Badges"
        onBack={handleBack}
        rightContent={
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>
              {earnedCount}/{totalCount}
            </Text>
          </View>
        }
      />

      {/* Progress Banner */}
      <View style={styles.progressBanner}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%` },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {earnedCount === totalCount
            ? "🎉 All badges collected!"
            : `${totalCount - earnedCount} more to collect`}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF8C32" />
        }
      >
        {Object.entries(badgesByCategory).map(([category, categoryBadges]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>
              {CATEGORY_LABELS[category] || category}
            </Text>
            <View style={styles.badgeGrid}>
              {categoryBadges.map((badge) => (
                <View
                  key={badge.id}
                  style={[
                    styles.badgeCard,
                    !badge.earned && styles.badgeCardLocked,
                  ]}
                >
                  <View
                    style={[
                      styles.badgeEmoji,
                      !badge.earned && styles.badgeEmojiLocked,
                    ]}
                  >
                    <Text style={styles.emoji}>{badge.emoji}</Text>
                    {!badge.earned && (
                      <View style={styles.lockOverlay}>
                        <MaterialIcons name="lock" size={16} color="#6B6B7B" />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.badgeName,
                      !badge.earned && styles.badgeNameLocked,
                    ]}
                    numberOfLines={1}
                  >
                    {badge.name}
                  </Text>
                  <Text style={styles.badgeDescription} numberOfLines={2}>
                    {badge.description}
                  </Text>
                  {badge.earned && badge.earnedAt && (
                    <Text style={styles.earnedDate}>
                      {new Date(badge.earnedAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F14",
  },

  progressBadge: {
    backgroundColor: "#FF8C32",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  progressText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  progressBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#1A1A22",
    borderRadius: 16,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#2A2A35",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FF8C32",
    borderRadius: 4,
  },
  progressLabel: {
    color: "#B0B0C3",
    fontSize: 13,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  badgeCard: {
    width: "47%",
    backgroundColor: "#1A1A22",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,140,50,0.3)",
  },
  badgeCardLocked: {
    borderColor: "rgba(255,255,255,0.05)",
    opacity: 0.6,
  },
  badgeEmoji: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,140,50,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  badgeEmojiLocked: {
    backgroundColor: "#2A2A35",
  },
  emoji: {
    fontSize: 28,
  },
  lockOverlay: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#0F0F14",
    borderRadius: 10,
    padding: 2,
  },
  badgeName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  badgeNameLocked: {
    color: "#6B6B7B",
  },
  badgeDescription: {
    color: "#6B6B7B",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14,
  },
  earnedDate: {
    color: "#3DDC97",
    fontSize: 10,
    marginTop: 8,
  },
});
