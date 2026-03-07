import { ScrollView, View, TouchableOpacity, Text, StyleSheet, Modal, TextInput, ActivityIndicator, RefreshControl } from "react-native";
import { Image } from "expo-image";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth, storage } from "@repo/auth";
import { useUser, API_URL, getFullAvatarUrl } from "../../hooks/useApi";
import * as ImagePicker from 'expo-image-picker';
import { useCustomAlert } from "../../contexts/CustomAlertContext";
import { useBadges } from "../../hooks/useApi";

import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { LevelProgressCard } from "../../components/profile/LevelProgressCard";
import { BadgesCard } from "../../components/profile/BadgesCard";
import { StatsOverviewCard } from "../../components/profile/StatsOverviewCard";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const authContext = useAuth();
  const { user, updateUser, uploadAvatar, deleteAccount, refetch } = useUser();
  const { badges, earnedCount, totalCount } = useBadges();
  const { showAlert } = useCustomAlert();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleBack = () => {
    router.back();
  };

  const handleSettings = () => {
    router.push("/(protected)/settings");
  };

  const handleEditProfile = () => {
    if (user) {
      setEditName(user.name);
      setEditAvatar(user.avatarUrl || "");
      setIsEditModalVisible(true);
    }
  };

  const pickImage = async () => {
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
      showAlert("Success", "Profile picture updated!");
      refetch();
    } catch (error: any) {
      showAlert("Error", error.message || "Failed to upload image");
    } finally {
      setUpdating(false);
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
             } catch (error: any) {
               showAlert("Error", error.message || "Failed to delete account");
             }
          }
        },
      ]
    );
  };

  const displayAvatar = getFullAvatarUrl(user?.avatarUrl) || "https://api.dicebear.com/7.x/avataaars/png?seed=PocketPal";

  // Transform real badge data for the BadgesCard preview
  // Show earned badges first, then unearned, take top 4
  const sortedBadges = [...badges].sort((a, b) => {
    if (a.earned && !b.earned) return -1;
    if (!a.earned && b.earned) return 1;
    return 0;
  });
  const previewBadges = sortedBadges.slice(0, 4).map(b => ({
    id: b.id,
    name: b.name,
    emoji: b.emoji,
    color: b.earned ? "#FF8C32" : "#6B6B7B",
    earned: b.earned,
  }));

  // Real stats from user data
  const realStats = [
    { id: "1", emoji: "🪙", value: user?.coins?.toLocaleString() || "0", label: "Total Coins" },
    { id: "2", emoji: "⭐", value: `Lv ${user?.level || 1}`, label: "Current Level" },
    { id: "3", emoji: "🏅", value: `${earnedCount}/${totalCount}`, label: "Badges Earned" },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader
        title="My Profile"
        onBack={handleBack}
        rightIcon="settings"
        onRightPress={handleSettings}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF8C32" />}
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

        {/* Badges — real data */}
        <BadgesCard 
          badges={previewBadges} 
          onViewAll={() => router.push("/(protected)/badges")} 
        />

        {/* Stats — real data */}
        <StatsOverviewCard stats={realStats} />

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
