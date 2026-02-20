import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";

import { useDuels, type Duel } from "../../hooks/useDuels";
import { useFriends, type Friend } from "../../hooks/useGamification";
import { useUser, getFullAvatarUrl } from "../../hooks/useUser";

const DUEL_TYPE_LABELS: Record<Duel["type"], { label: string; emoji: string; description: string }> = {
  most_saved: { label: "Most Saved", emoji: "💰", description: "Who can save more?" },
  fewest_expenses: { label: "Fewest Expenses", emoji: "🛑", description: "Fewer purchases wins" },
  no_spend_streak: { label: "No-Spend Streak", emoji: "🔥", description: "Longest no-spend streak" },
};

export default function DuelsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();
  const { friends } = useFriends();
  const {
    duels,
    duelsLoading,
    record,
    createDuel,
    respondToDuel,
    creating,
    responding,
    refetchDuels,
    refetchHistory,
  } = useDuels();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [selectedType, setSelectedType] = useState<Duel["type"]>("most_saved");
  const [wager, setWager] = useState(10);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchDuels(), refetchHistory()]);
    setRefreshing(false);
  }, [refetchDuels, refetchHistory]);

  const handleCreateDuel = async () => {
    if (!selectedFriend) return;
    try {
      await createDuel({
        challengedId: selectedFriend.id,
        type: selectedType,
        wager,
      });
      setShowCreate(false);
      setSelectedFriend(null);
      Alert.alert("⚔️ Challenge Sent!", `Duel request sent to ${selectedFriend.name}`);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create duel");
    }
  };

  const handleRespond = async (duelId: string, action: "accept" | "decline") => {
    try {
      await respondToDuel(duelId, action);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to respond");
    }
  };

  const activeDuels = duels.filter((d) => d.status === "active");
  const pendingDuels = duels.filter(
    (d) => d.status === "pending" && d.challengedId === user?.id
  );
  const sentDuels = duels.filter(
    (d) => d.status === "pending" && d.challengerId === user?.id
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚔️ Duels</Text>
        <View style={styles.recordBadge}>
          <Text style={styles.recordText}>
            {record.wins}W / {record.losses}L
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF8C32" />
        }
      >
        {/* Challenge Button */}
        <TouchableOpacity
          style={styles.challengeButton}
          onPress={() => setShowCreate(!showCreate)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#FF8C32", "#FF6B1A"]}
            style={styles.challengeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialIcons name="sports-mma" size={24} color="#FFFFFF" />
            <Text style={styles.challengeButtonText}>Challenge a Friend</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Create Duel Panel */}
        {showCreate && (
          <View style={styles.createPanel}>
            <Text style={styles.sectionTitle}>Pick a Friend</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendScroll}>
              {friends.map((friend) => (
                <TouchableOpacity
                  key={friend.id}
                  style={[
                    styles.friendChip,
                    selectedFriend?.id === friend.id && styles.friendChipSelected,
                  ]}
                  onPress={() => setSelectedFriend(friend)}
                >
                  <View style={styles.friendAvatar}>
                    {friend.avatarUrl ? (
                      <Image
                        source={{ uri: getFullAvatarUrl(friend.avatarUrl) as string }}
                        style={styles.friendAvatarImage}
                      />
                    ) : (
                      <Text style={styles.friendAvatarEmoji}>👤</Text>
                    )}
                  </View>
                  <Text style={styles.friendName} numberOfLines={1}>{friend.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Duel Type</Text>
            <View style={styles.typeGrid}>
              {(Object.keys(DUEL_TYPE_LABELS) as Duel["type"][]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeCard,
                    selectedType === type && styles.typeCardSelected,
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text style={styles.typeEmoji}>{DUEL_TYPE_LABELS[type].emoji}</Text>
                  <Text style={styles.typeLabel}>{DUEL_TYPE_LABELS[type].label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Wager</Text>
            <View style={styles.wagerRow}>
              {[5, 10, 25, 50, 100].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.wagerChip, wager === amount && styles.wagerChipSelected]}
                  onPress={() => setWager(amount)}
                >
                  <Text style={[styles.wagerText, wager === amount && styles.wagerTextSelected]}>
                    {amount} 🪙
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.sendChallengeButton, (!selectedFriend || creating) && styles.buttonDisabled]}
              onPress={handleCreateDuel}
              disabled={!selectedFriend || creating}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.sendChallengeText}>
                  Send Challenge ({wager} coins) ⚔️
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {duelsLoading ? (
          <ActivityIndicator size="large" color="#FF8C32" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Incoming Challenges */}
            {pendingDuels.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔔 Incoming Challenges</Text>
                {pendingDuels.map((duel) => (
                  <View key={duel.id} style={styles.duelCard}>
                    <View style={styles.duelCardHeader}>
                      <Text style={styles.duelEmoji}>{DUEL_TYPE_LABELS[duel.type].emoji}</Text>
                      <View style={styles.duelCardInfo}>
                        <Text style={styles.duelTitle}>{duel.challenger.name} challenges you!</Text>
                        <Text style={styles.duelSubtitle}>
                          {DUEL_TYPE_LABELS[duel.type].label} • {duel.wager} coins
                        </Text>
                      </View>
                    </View>
                    <View style={styles.duelActions}>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleRespond(duel.id, "accept")}
                        disabled={responding}
                      >
                        <Text style={styles.acceptText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.declineButton}
                        onPress={() => handleRespond(duel.id, "decline")}
                        disabled={responding}
                      >
                        <Text style={styles.declineText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Active Duels */}
            {activeDuels.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚔️ Active Duels</Text>
                {activeDuels.map((duel) => {
                  const isChallenger = duel.challengerId === user?.id;
                  const myProgress = isChallenger ? duel.challengerProgress : duel.challengedProgress;
                  const theirProgress = isChallenger ? duel.challengedProgress : duel.challengerProgress;
                  const opponent = isChallenger ? duel.challenged : duel.challenger;
                  const isLowerBetter = duel.type === "fewest_expenses";
                  const maxProgress = Math.max(myProgress, theirProgress, 1);
                  const myPercent = (myProgress / maxProgress) * 100;
                  const theirPercent = (theirProgress / maxProgress) * 100;

                  return (
                    <View key={duel.id} style={styles.duelCard}>
                      <View style={styles.duelCardHeader}>
                        <Text style={styles.duelEmoji}>{DUEL_TYPE_LABELS[duel.type].emoji}</Text>
                        <View style={styles.duelCardInfo}>
                          <Text style={styles.duelTitle}>vs {opponent.name}</Text>
                          <Text style={styles.duelSubtitle}>
                            {DUEL_TYPE_LABELS[duel.type].label} • {duel.wager} coins at stake
                          </Text>
                        </View>
                      </View>
                      {/* Progress bars */}
                      <View style={styles.progressSection}>
                        <View style={styles.progressRow}>
                          <Text style={styles.progressLabel}>You</Text>
                          <View style={styles.progressBarBg}>
                            <View
                              style={[
                                styles.progressBarFill,
                                { width: `${myPercent}%`, backgroundColor: "#3DDC97" },
                              ]}
                            />
                          </View>
                          <Text style={styles.progressValue}>
                            {isLowerBetter ? `${myProgress}` : `₹${myProgress}`}
                          </Text>
                        </View>
                        <View style={styles.progressRow}>
                          <Text style={styles.progressLabel}>{opponent.name.split(" ")[0]}</Text>
                          <View style={styles.progressBarBg}>
                            <View
                              style={[
                                styles.progressBarFill,
                                { width: `${theirPercent}%`, backgroundColor: "#EF5DA8" },
                              ]}
                            />
                          </View>
                          <Text style={styles.progressValue}>
                            {isLowerBetter ? `${theirProgress}` : `₹${theirProgress}`}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Sent (waiting) */}
            {sentDuels.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⏳ Waiting for Response</Text>
                {sentDuels.map((duel) => (
                  <View key={duel.id} style={styles.duelCard}>
                    <View style={styles.duelCardHeader}>
                      <Text style={styles.duelEmoji}>{DUEL_TYPE_LABELS[duel.type].emoji}</Text>
                      <View style={styles.duelCardInfo}>
                        <Text style={styles.duelTitle}>Sent to {duel.challenged.name}</Text>
                        <Text style={styles.duelSubtitle}>
                          {DUEL_TYPE_LABELS[duel.type].label} • {duel.wager} coins
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Empty state */}
            {activeDuels.length === 0 && pendingDuels.length === 0 && sentDuels.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>⚔️</Text>
                <Text style={styles.emptyTitle}>No active duels</Text>
                <Text style={styles.emptySubtitle}>Challenge a friend to a savings duel!</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F14" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  recordBadge: {
    backgroundColor: "rgba(255, 140, 50, 0.15)",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(255, 140, 50, 0.3)",
  },
  recordText: { color: "#FF8C32", fontSize: 13, fontWeight: "700" },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  challengeButton: { marginBottom: 20 },
  challengeGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 16, gap: 10,
  },
  challengeButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  createPanel: {
    backgroundColor: "#1A1A22", borderRadius: 20, padding: 20,
    marginBottom: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
  },
  section: { marginBottom: 24 },
  sectionTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginBottom: 12 },
  friendScroll: { marginBottom: 4 },
  friendChip: {
    alignItems: "center", marginRight: 12, paddingVertical: 8,
    paddingHorizontal: 12, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "transparent", width: 80,
  },
  friendChipSelected: { borderColor: "#FF8C32", backgroundColor: "rgba(255,140,50,0.1)" },
  friendAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center", marginBottom: 6,
  },
  friendAvatarImage: { width: 40, height: 40, borderRadius: 20 },
  friendAvatarEmoji: { fontSize: 20 },
  friendName: { color: "#B0B0C3", fontSize: 11, fontWeight: "500", textAlign: "center" },
  typeGrid: { flexDirection: "row", gap: 10 },
  typeCard: {
    flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "transparent",
  },
  typeCardSelected: { borderColor: "#FF8C32", backgroundColor: "rgba(255,140,50,0.1)" },
  typeEmoji: { fontSize: 24, marginBottom: 4 },
  typeLabel: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" },
  wagerRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  wagerChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "transparent",
  },
  wagerChipSelected: { borderColor: "#FF8C32", backgroundColor: "rgba(255,140,50,0.1)" },
  wagerText: { color: "#B0B0C3", fontSize: 13, fontWeight: "600" },
  wagerTextSelected: { color: "#FF8C32" },
  sendChallengeButton: {
    backgroundColor: "#FF8C32", borderRadius: 14, paddingVertical: 14,
    alignItems: "center", marginTop: 20,
  },
  buttonDisabled: { opacity: 0.4 },
  sendChallengeText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  duelCard: {
    backgroundColor: "#1A1A22", borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
  },
  duelCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  duelEmoji: { fontSize: 28 },
  duelCardInfo: { flex: 1 },
  duelTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  duelSubtitle: { color: "#B0B0C3", fontSize: 12, marginTop: 2 },
  duelActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  acceptButton: {
    flex: 1, backgroundColor: "#3DDC97", borderRadius: 12,
    paddingVertical: 10, alignItems: "center",
  },
  acceptText: { color: "#0F0F14", fontSize: 14, fontWeight: "700" },
  declineButton: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12,
    paddingVertical: 10, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  declineText: { color: "#B0B0C3", fontSize: 14, fontWeight: "600" },
  progressSection: { marginTop: 14, gap: 8 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressLabel: { color: "#B0B0C3", fontSize: 11, fontWeight: "600", width: 50 },
  progressBarBg: {
    flex: 1, height: 8, borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.05)", overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 4 },
  progressValue: { color: "#FFFFFF", fontSize: 12, fontWeight: "700", width: 60, textAlign: "right" },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  emptySubtitle: { color: "#B0B0C3", fontSize: 14 },
});
