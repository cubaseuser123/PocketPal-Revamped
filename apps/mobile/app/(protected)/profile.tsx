import { ScrollView, View, TouchableOpacity, Text, StyleSheet, Modal, TextInput, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth, storage } from "@repo/auth";
import { useUser, API_URL, getFullAvatarUrl } from "../../hooks/useApi";
import * as ImagePicker from 'expo-image-picker';
import { useCustomAlert } from "../../contexts/CustomAlertContext";

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
  { id: "1", emoji: "🪙", value: "---", label: "Total Coins" },
  { id: "2", emoji: "🔥", value: "9 days", label: "Longest Streak" },
  { id: "3", emoji: "💰", value: "₹4,800", label: "Total Saved" },
];

const MOCK_MENU_ITEMS = [
  { id: "subscriptions", icon: "payment" as const, label: "Subscriptions" },
  { id: "notifications", icon: "notifications" as const, label: "Notifications" },
  { id: "verification", icon: "verified" as const, label: "Verification", badge: "KYC DONE", badgeColor: "#3DDC97" },
  { id: "help", icon: "help" as const, label: "Help" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const authContext = useAuth();
  const { user, updateUser, uploadAvatar, deleteAccount, refetch } = useUser();
  const { showAlert } = useCustomAlert();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleSettings = () => {
    console.log("Open settings");
  };

  const handleEditProfile = () => {
    if (user) {
      setEditName(user.name);
      setEditAvatar(user.avatarUrl || "");
      setIsEditModalVisible(true);
    }
  };

  const pickImage = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      showAlert("Permission Required", "You've refused to allow this app to access your photos!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      uploadImage(uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUpdating(true);
    try {
      await uploadAvatar(uri);
      // Avatar update handled by refetch in hook onSuccess?
      // Actually we might need to manually set it if optimistic not set, 
      // but invalidation handles it.
      // We can also setEditAvatar here for immediate feedback if needed but 
      // refetch() should propagate via 'user' prop.
      
      showAlert("Success", "Profile picture updated!");
      refetch();
    } catch (error: any) {
      showAlert("Error", error.message || "Failed to upload image");
    } finally {
      setUpdating(false);
    }
  };


  const handleMenuPress = (id: string) => {
    if (id === "subscriptions") {
      router.push("/(protected)/subscriptions");
    } else if (id === "verification") {
      if (user?.kycCompleted) {
        showAlert("Verified", "You are already a fully verified user!");
      } else {
        router.push("/(protected)/full-kyc-benefits");
      }
    } else {
      console.log("Menu item pressed:", id);
    }
  };

  const handleLogout = () => {
    showAlert(
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

  const handleDeleteAccount = () => {
    showAlert(
      "Delete Account",
      "Are you sure you want to delete your account? This action is irreversible and all your data will be lost forever.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Forever", 
          style: "destructive",
          onPress: async () => {
             try {
               await deleteAccount();
               await authContext?.logout();
               router.replace("/(auth)/welcome");
               // Small delay to ensure alert is closed before the next one (if any) or navigation handles it
             } catch (error: any) {
               showAlert("Error", error.message || "Failed to delete account");
             }
          }
        },
      ]
    );
  };

  const displayAvatar = getFullAvatarUrl(user?.avatarUrl) || "https://api.dicebear.com/7.x/avataaars/png?seed=PocketPal";

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
          name={user?.name || "User"}
          subtitle={user?.phone || "PocketPal User"}
          avatarUrl={displayAvatar}
          onEditPress={handleEditProfile}
        />

        {/* Level Progress */}
        <LevelProgressCard 
          level={user?.level || 1} 
          currentXp={user?.coins ? user.coins % 1000 : 0} 
          maxXp={1000} 
        />

        {/* Badges */}
        <BadgesCard badges={MOCK_BADGES} />

        {/* Stats */}
        <StatsOverviewCard 
          stats={MOCK_STATS.map(stat => 
            stat.id === "1" ? { ...stat, value: user?.coins?.toLocaleString() || "0" } : stat
          )} 
        />

        {/* Settings Menu */}
        <SettingsMenuCard 
          items={MOCK_MENU_ITEMS.map(item => 
            item.id === "verification" 
              ? { 
                  ...item, 
                  badge: user?.kycCompleted ? "VERIFIED" : "UPGRADE", 
                  badgeColor: user?.kycCompleted ? "#3DDC97" : "#FF8C32" 
                } 
              : item
          )} 
          onItemPress={handleMenuPress} 
        />

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Delete Account Button */}
        <TouchableOpacity style={[styles.logoutButton, { borderColor: "rgba(239, 68, 68, 0.1)", backgroundColor: "rgba(239, 68, 68, 0.05)", marginTop: -8 }]} onPress={handleDeleteAccount}>
          <MaterialIcons name="delete-forever" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Image 
                source={{ uri: editAvatar || "https://api.dicebear.com/7.x/avataaars/png?seed=PocketPal" }} 
                style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 10, backgroundColor: '#333' }} 
              />
              <TouchableOpacity 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  gap: 8, 
                  backgroundColor: 'rgba(255, 140, 50, 0.15)', 
                  paddingHorizontal: 16, 
                  paddingVertical: 8, 
                  borderRadius: 20 
                }}
                onPress={pickImage}
                disabled={updating}
              >
                <MaterialIcons name="photo-camera" size={18} color="#FF8C32" />
                <Text style={{ color: '#FF8C32', fontWeight: '600' }}>Change Photo</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput 
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your Name"
              placeholderTextColor="#666"
            />
            
            <Text style={styles.inputLabel}>Avatar URL (or upload above)</Text>
            <TextInput 
              style={styles.input}
              value={editAvatar}
              onChangeText={setEditAvatar}
              placeholder="https://..."
              placeholderTextColor="#666"
              autoCapitalize="none"
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelBtn]} 
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveBtn]} 
                onPress={async () => {
                  if (!editName) return;
                  setUpdating(true);
                  try {
                    await updateUser({ 
                      name: editName,
                      avatarUrl: editAvatar || undefined
                    });
                    setIsEditModalVisible(false);
                    refetch();
                  } catch (e) {
                    showAlert("Error", "Failed to update profile");
                  } finally {
                    setUpdating(false);
                  }
                }}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1C1C23",
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  inputLabel: {
    color: "#B0B0C3",
    fontSize: 14,
    marginBottom: -8,
  },
  input: {
    backgroundColor: "#2A2A35",
    borderRadius: 12,
    padding: 16,
    color: "#FFF",
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#2A2A35",
  },
  saveBtn: {
    backgroundColor: "#FF8C32",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
