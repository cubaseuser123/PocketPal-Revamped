import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Share,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { useFriends, useUser, getFullAvatarUrl } from "../../hooks/useApi";
import { useCustomAlert } from "../../contexts/CustomAlertContext";

type Tab = "friends" | "requests" | "add";

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useCustomAlert();

  const { user } = useUser();
  const {
    friends,
    pendingRequests,
    loading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    refetchFriends,
    refetchPending,
  } = useFriends();

  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [friendCode, setFriendCode] = useState("");
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFriends(), refetchPending()]);
    setRefreshing(false);
  }, [refetchFriends, refetchPending]);

  const handleSendRequest = async () => {
    if (!friendCode.trim()) {
      showAlert("Error", "Please enter a friend code");
      return;
    }

    setSending(true);
    try {
      await sendRequest(friendCode.toUpperCase());
      showAlert("Request Sent!", "Your friend request has been sent");
      setFriendCode("");
    } catch (err: any) {
      showAlert("Error", err.message || "Failed to send request");
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await acceptRequest(requestId);
      showAlert("Friend Added!", "You are now friends");
    } catch (err: any) {
      showAlert("Error", err.message);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectRequest(requestId);
    } catch (err: any) {
      showAlert("Error", err.message);
    }
  };

  const handleRemove = async (friendshipId: string, friendName: string) => {
    showAlert(
      "Remove Friend",
      `Are you sure you want to remove ${friendName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFriend(friendshipId);
            } catch (err: any) {
              showAlert("Error", err.message);
            }
          },
        },
      ],
    );
  };

  const handleShareCode = async () => {
    if (!user?.friendCode) return;
    try {
      await Share.share({
        message: `Add me on PocketPal! My friend code is: ${user.friendCode}`,
      });
    } catch {}
  };

  const handleViewLeaderboard = () => {
    router.push("/(protected)/leaderboard");
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
          <Text style={styles.headerTitle}>Friends</Text>
        </View>
        <TouchableOpacity
          onPress={handleViewLeaderboard}
          style={styles.leaderboardButton}
        >
          <MaterialIcons name="leaderboard" size={20} color="#FF8C32" />
        </TouchableOpacity>
      </View>

      {/* My Code Banner */}
      <View style={styles.codeBanner}>
        <View style={styles.codeBannerContent}>
          <View>
            <Text style={styles.codeLabel}>Your Friend Code</Text>
            <Text style={styles.codeText}>{user?.friendCode || "------"}</Text>
          </View>
          <TouchableOpacity
            onPress={handleShareCode}
            style={styles.shareButton}
          >
            <MaterialIcons name="share" size={18} color="#FF8C32" />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(["friends", "requests", "add"] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab === "requests"
                ? `Requests${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ""}`
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
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
        ) : activeTab === "friends" ? (
          friends.length === 0 ? (
            <View style={styles.centerContainer}>
              <MaterialIcons name="people-outline" size={48} color="#6B6B7B" />
              <Text style={styles.emptyText}>
                No friends yet.{"\n"}Share your code to add friends!
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {friends.map((friend) => (
                <View key={friend.id} style={styles.friendCard}>
                  <View style={styles.avatarContainer}>
                    {friend.avatarUrl ? (
                      <Image
                        source={{
                          uri: getFullAvatarUrl(friend.avatarUrl) || undefined,
                        }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarEmoji}>👤</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    <Text style={styles.friendMeta}>
                      Level {friend.level} • {friend.coins} coins
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      handleRemove(friend.friendshipId, friend.name)
                    }
                    style={styles.moreButton}
                  >
                    <MaterialIcons name="more-vert" size={20} color="#6B6B7B" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )
        ) : activeTab === "requests" ? (
          pendingRequests.length === 0 ? (
            <View style={styles.centerContainer}>
              <MaterialIcons name="mail-outline" size={48} color="#6B6B7B" />
              <Text style={styles.emptyText}>No pending requests</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {pendingRequests.map((req) => (
                <View key={req.id} style={styles.friendCard}>
                  <View style={styles.avatarContainer}>
                    {req.from.avatarUrl ? (
                      <Image
                        source={{
                          uri: getFullAvatarUrl(req.from.avatarUrl) || undefined,
                        }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarEmoji}>👤</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{req.from.name}</Text>
                    <Text style={styles.friendMeta}>
                      Level {req.from.level}
                    </Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => handleReject(req.id)}
                      style={styles.rejectButton}
                    >
                      <MaterialIcons name="close" size={20} color="#FF4B4B" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleAccept(req.id)}
                      style={styles.acceptButton}
                    >
                      <MaterialIcons name="check" size={20} color="#3DDC97" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )
        ) : (
          // Add Friend Tab
          <View style={styles.addContainer}>
            <Text style={styles.addLabel}>Enter Friend Code</Text>
            <View style={styles.addInputRow}>
              <TextInput
                value={friendCode}
                onChangeText={setFriendCode}
                placeholder="e.g. A3X9K2"
                placeholderTextColor="#6B6B7B"
                style={styles.addInput}
                autoCapitalize="characters"
                maxLength={6}
              />
              <TouchableOpacity
                onPress={handleSendRequest}
                disabled={sending}
                style={styles.sendButton}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <MaterialIcons name="send" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.helpCard}>
              <Text style={styles.helpText}>
                Ask your friends for their 6-character code, or share yours
                above to connect!
              </Text>
            </View>
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
  leaderboardButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A22",
    alignItems: "center",
    justifyContent: "center",
  },
  codeBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#1A1A22",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  codeBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codeLabel: {
    color: "#B0B0C3",
    fontSize: 12,
    marginBottom: 4,
  },
  codeText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 4,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,140,50,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  shareButtonText: {
    color: "#FF8C32",
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#1A1A22",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#FF8C32",
  },
  tabText: {
    color: "#6B6B7B",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  activeTabText: {
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
    textAlign: "center",
    lineHeight: 22,
  },
  listContainer: {
    gap: 12,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A22",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
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
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  friendMeta: {
    color: "#6B6B7B",
    fontSize: 13,
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,75,75,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(61,220,151,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  addContainer: {
    gap: 16,
  },
  addLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  addInputRow: {
    flexDirection: "row",
    gap: 12,
  },
  addInput: {
    flex: 1,
    backgroundColor: "#1A1A22",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: "#FFFFFF",
    fontSize: 18,
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  sendButton: {
    width: 56,
    backgroundColor: "#FF8C32",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  helpCard: {
    backgroundColor: "#1A1A22",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  helpText: {
    color: "#6B6B7B",
    textAlign: "center",
    lineHeight: 20,
  },
});
