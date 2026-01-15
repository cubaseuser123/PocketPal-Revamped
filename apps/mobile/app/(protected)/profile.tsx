import { ScrollView, View, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@repo/auth";

import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { LevelProgressCard } from "../../components/profile/LevelProgressCard";
import { BadgesCard } from "../../components/profile/BadgesCard";
import { StatsOverviewCard } from "../../components/profile/StatsOverviewCard";
import { SettingsMenuCard } from "../../components/profile/SettingsMenuCard";

// Mock data
const MOCK_BADGES = [
  { id: "1", name: "Early Saver", emoji: "🌱", color: "#10B981", unlocked: true },
  { id: "2", name: "Boss Slayer", emoji: "⚔️", color: "#8B5CF6", unlocked: true },
  { id: "3", name: "Streak Master", emoji: "🔥", color: "#EF4444", unlocked: false },
  { id: "4", name: "Rich List", emoji: "💰", color: "#FFD166", unlocked: false },
];

const MOCK_STATS = [
  { id: "1", emoji: "🪙", value: "1,250", label: "Total Coins" },
  { id: "2", emoji: "🔥", value: "9 days", label: "Longest Streak" },
  { id: "3", emoji: "💰", value: "₹4,800", label: "Total Saved" },
];

const MOCK_MENU_ITEMS = [
  { id: "notifications", icon: "notifications" as const, label: "Notifications" },
  { id: "verification", icon: "verified" as const, label: "Verification", badge: "KYC DONE", badgeColor: "#3DDC97" },
  { id: "help", icon: "help" as const, label: "Help" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const authContext = useAuth();

  const handleBack = () => {
    router.back();
  };

  const handleSettings = () => {
    console.log("Open settings");
  };

  const handleEditProfile = () => {
    console.log("Edit profile");
  };

  const handleMenuPress = (id: string) => {
    console.log("Menu item pressed:", id);
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            await authContext?.logout();
            router.replace("/(auth)/welcome");
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleSettings}>
          <MaterialIcons name="settings" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info */}
        <ProfileHeader
          name="Harsh"
          subtitle="Student @ XYZ University"
          avatarUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuCgYdfbobFGGHhdgWxoDaUCEs63jw9XW071wbK2QOYAOFr2eumOPIZMnD4-EjLmX6rpo5RGDb2w1yX4aDUQ6EuQ5xXpNfNjDkmAcC6QV19DO-_WOjqzKcvsUddIdhAIoXsc44nJ5qv_DFXZN-5kHrVbywVjAefDZkPu9VYMbmKDlrkI7-01lLtYfjGqT8HhqjjRJdzf7-8hyPXlzBFCC5c83r8oPLzacBgkgNoAi_VuLjUYw0rUrW6s635ldlnrqY4JmjbwWVebHIwZ"
          onEditPress={handleEditProfile}
        />

        {/* Level Progress */}
        <LevelProgressCard level={3} currentXp={340} maxXp={500} />

        {/* Badges */}
        <BadgesCard badges={MOCK_BADGES} />

        {/* Stats */}
        <StatsOverviewCard stats={MOCK_STATS} />

        {/* Settings Menu */}
        <SettingsMenuCard items={MOCK_MENU_ITEMS} onItemPress={handleMenuPress} />

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: "rgba(15, 15, 20, 0.9)",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
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
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    marginBottom: 16,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "700",
  },
});
