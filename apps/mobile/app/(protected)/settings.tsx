import { ScrollView, View, TouchableOpacity, Text, StyleSheet, Switch, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useUser, API_URL } from "../../hooks/useUser";
import { useCustomAlert } from "../../contexts/CustomAlertContext";
import { storage } from "@repo/auth";

// Check if we're in development mode
const isDev = process.env.NODE_ENV !== 'production' || __DEV__;

interface SettingItem {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  type: 'navigate' | 'toggle' | 'action';
  value?: boolean;
  badge?: string;
  badgeColor?: string;
  onPress?: () => void;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { showAlert } = useCustomAlert();
  
  // Toggle states
  const [pushEnabled, setPushEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  
  // Loading states for dev tools
  const [testingNotification, setTestingNotification] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [testingAgent, setTestingAgent] = useState(false);

  const handleBack = () => {
    router.back();
  };

  // Dev notification testing functions
  const sendTestNotification = async () => {
    setTestingNotification(true);
    try {
      const token = await storage.get("access_token");
      const response = await fetch(`${API_URL}/api/v1/notifications/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: '🧪 Test from Settings',
          body: 'This is a test notification triggered from the settings screen!',
          type: 'insight'
        }),
      });
      const data = await response.json();
      showAlert("Success", data.message || "Notification sent!");
    } catch (error: any) {
      showAlert("Error", error.message || "Failed to send notification");
    } finally {
      setTestingNotification(false);
    }
  };

  const sendTestPush = async () => {
    setTestingPush(true);
    try {
      const token = await storage.get("access_token");
      const response = await fetch(`${API_URL}/api/v1/notifications/test-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: '🔔 Push from Settings',
          body: 'This is a test push notification!'
        }),
      });
      const data = await response.json();
      showAlert("Push Result", data.message || "Push sent!");
    } catch (error: any) {
      showAlert("Error", error.message || "Failed to send push");
    } finally {
      setTestingPush(false);
    }
  };

  const triggerNotificationAgent = async () => {
    setTestingAgent(true);
    try {
      const token = await storage.get("access_token");
      const response = await fetch(`${API_URL}/api/v1/notifications/trigger-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.result) {
        showAlert("Agent Result", `${data.result.title}\n\n${data.result.body}`, [{ text: "OK" }]);
      } else {
        showAlert("Agent Result", data.message || "Agent ran successfully");
      }
    } catch (error: any) {
      showAlert("Error", error.message || "Failed to trigger agent");
    } finally {
      setTestingAgent(false);
    }
  };

  const sections: SettingSection[] = [
    {
      title: "Account",
      items: [
        { id: "profile", icon: "person", label: "Edit Profile", type: "navigate" },
        { id: "phone", icon: "phone", label: "Change Phone Number", type: "navigate" },
        { id: "kyc", icon: "verified-user", label: "KYC Status", type: "navigate", badge: user?.kycCompleted ? "VERIFIED" : "PENDING", badgeColor: user?.kycCompleted ? "#10B981" : "#F59E0B" },
      ],
    },
    {
      title: "Security",
      items: [
        { id: "biometric", icon: "fingerprint", label: "Biometric Login", type: "toggle", value: biometricEnabled },
        { id: "pin", icon: "lock", label: "Change PIN", type: "navigate" },
        { id: "devices", icon: "devices", label: "Logged-in Devices", type: "navigate" },
      ],
    },
    {
      title: "Notifications",
      items: [
        { id: "push", icon: "notifications", label: "Push Notifications", type: "toggle", value: pushEnabled },
        { id: "email", icon: "email", label: "Email Alerts", type: "navigate" },
        { id: "reminders", icon: "alarm", label: "Payment Reminders", type: "navigate" },
      ],
    },
    {
      title: "Payments",
      items: [
        { id: "upi", icon: "account-balance", label: "UPI Settings", type: "navigate" },
        { id: "autopay", icon: "autorenew", label: "Auto-Pay", type: "navigate" },
        { id: "limits", icon: "tune", label: "Transaction Limits", type: "navigate" },
      ],
    },
    {
      title: "Preferences",
      items: [
        { id: "language", icon: "language", label: "Language", type: "navigate", badge: "English" },
        { id: "darkmode", icon: "dark-mode", label: "Dark Mode", type: "toggle", value: darkMode },
        { id: "autosave", icon: "savings", label: "Auto-Save Roundups", type: "toggle", value: autoSaveEnabled },
      ],
    },
    {
      title: "Support",
      items: [
        { id: "help", icon: "help", label: "Help Center", type: "navigate" },
        { id: "chat", icon: "chat", label: "Chat with Pally", type: "navigate" },
        { id: "feedback", icon: "feedback", label: "Send Feedback", type: "navigate" },
      ],
    },
    {
      title: "Legal",
      items: [
        { id: "privacy", icon: "privacy-tip", label: "Privacy Policy", type: "navigate" },
        { id: "terms", icon: "description", label: "Terms of Service", type: "navigate" },
        { id: "licenses", icon: "article", label: "Open Source Licenses", type: "navigate" },
      ],
    },
  ];

  const handleItemPress = (item: SettingItem) => {
    if (item.type === 'toggle') {
      // Handle toggle
      switch (item.id) {
        case 'push': setPushEnabled(!pushEnabled); break;
        case 'biometric': setBiometricEnabled(!biometricEnabled); break;
        case 'autosave': setAutoSaveEnabled(!autoSaveEnabled); break;
        case 'darkmode': setDarkMode(!darkMode); break;
      }
    } else if (item.type === 'navigate') {
      // Navigate to specific screens
      switch (item.id) {
        case 'profile':
          router.back(); // Go back to profile which has edit
          break;
        case 'kyc':
          router.push('/(protected)/full-kyc-benefits');
          break;
        default:
          showAlert("Coming Soon", `${item.label} settings will be available in a future update.`);
      }
    }
  };

  const renderSection = (section: SettingSection, index: number) => (
    <View key={section.title} style={[styles.section, index === 0 && { marginTop: 0 }]}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionCard}>
        {section.items.map((item, idx) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.settingItem, idx < section.items.length - 1 && styles.itemBorder]}
            onPress={() => handleItemPress(item)}
            activeOpacity={item.type === 'toggle' ? 1 : 0.7}
          >
            <View style={styles.itemLeft}>
              <View style={styles.iconBox}>
                <MaterialIcons name={item.icon} size={20} color="#FF8C32" />
              </View>
              <Text style={styles.itemLabel}>{item.label}</Text>
            </View>
            
            <View style={styles.itemRight}>
              {item.badge && (
                <View style={[styles.badge, { backgroundColor: `${item.badgeColor || '#6366F1'}20` }]}>
                  <Text style={[styles.badgeText, { color: item.badgeColor || '#6366F1' }]}>
                    {item.badge}
                  </Text>
                </View>
              )}
              {item.type === 'toggle' ? (
                <Switch
                  value={item.value}
                  onValueChange={() => handleItemPress(item)}
                  trackColor={{ false: '#3A3A45', true: '#FF8C3250' }}
                  thumbColor={item.value ? '#FF8C32' : '#888'}
                />
              ) : (
                <MaterialIcons name="chevron-right" size={24} color="#666" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Dev Tools Section - Only in development */}
        {isDev && (
          <View style={styles.devSection}>
            <View style={styles.devHeader}>
              <MaterialIcons name="bug-report" size={20} color="#F59E0B" />
              <Text style={styles.devTitle}>🛠️ Developer Tools</Text>
            </View>
            <Text style={styles.devSubtitle}>These buttons are only visible in development mode</Text>
            
            <View style={styles.devButtons}>
              <TouchableOpacity 
                style={styles.devButton} 
                onPress={sendTestNotification}
                disabled={testingNotification}
              >
                {testingNotification ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="notifications-active" size={20} color="#FFF" />
                    <Text style={styles.devButtonText}>Send In-App</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.devButton, styles.devButtonPush]} 
                onPress={sendTestPush}
                disabled={testingPush}
              >
                {testingPush ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="send" size={20} color="#FFF" />
                    <Text style={styles.devButtonText}>Send Push</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.devButton, styles.devButtonAgent]} 
                onPress={triggerNotificationAgent}
                disabled={testingAgent}
              >
                {testingAgent ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="psychology" size={20} color="#FFF" />
                    <Text style={styles.devButtonText}>Run AI Agent</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Settings Sections */}
        {sections.map((section, index) => renderSection(section, index))}

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>PocketPal v1.0.0</Text>
          <Text style={styles.versionSubtext}>Made with 💜 in India</Text>
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
    paddingBottom: 12,
    backgroundColor: "rgba(15, 15, 20, 0.95)",
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
    paddingTop: 16,
  },
  // Dev Tools
  devSection: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    padding: 16,
    marginBottom: 24,
  },
  devHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  devTitle: {
    color: "#F59E0B",
    fontSize: 16,
    fontWeight: "700",
  },
  devSubtitle: {
    color: "#F59E0B80",
    fontSize: 12,
    marginBottom: 16,
  },
  devButtons: {
    flexDirection: "row",
    gap: 8,
  },
  devButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#10B981",
    paddingVertical: 12,
    borderRadius: 12,
  },
  devButtonPush: {
    backgroundColor: "#6366F1",
  },
  devButtonAgent: {
    backgroundColor: "#8B5CF6",
  },
  devButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  // Sections
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: "#1A1A22",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 140, 50, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  // Version
  versionContainer: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16,
  },
  versionText: {
    color: "#555",
    fontSize: 14,
  },
  versionSubtext: {
    color: "#444",
    fontSize: 12,
    marginTop: 4,
  },
});
