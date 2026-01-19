import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image as RNImage,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Contacts from "expo-contacts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useUser, useFriends, useCreateSplitGroup } from "../../hooks/useApi";

export default function SplitBillSelectorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { user } = useUser();
  const { friends: realFriends, loading: friendsLoading } = useFriends();
  const { createGroup, isLoading: creating } = useCreateSplitGroup();

  // Params from previous screen
  const totalAmount = parseFloat((params.amount as string) || "0");
  const payeeName = (params.payeeName as string) || "Unknown";
  const vpa = (params.vpa as string) || "";

  const [contactList, setContacts] = useState<Contacts.Contact[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]); // Array of IDs
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"friends" | "contacts">("friends");

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
        sort: Contacts.SortTypes.FirstName,
      });
      const validContacts = data.filter(
        (c) => c.phoneNumbers && c.phoneNumbers.length > 0,
      );
      setContacts(validContacts);
    }
    setLoading(false);
  };

  const toggleSelection = (id: string) => {
    setSelectedUsers((prev) => {
      if (prev.includes(id)) {
        return prev.filter((uid) => uid !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const getSplitAmount = () => {
    const peopleCount = selectedUsers.length + 1; // +1 for yourself
    return (totalAmount / peopleCount).toFixed(2);
  };

  const handleConfirmSplit = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert(
        "Select Friends",
        "Please select at least one friend to split with.",
      );
      return;
    }

    try {
      const group = await createGroup({
        name: payeeName || "Split Bill",
        totalAmount: totalAmount,
        members: selectedUsers, // IDs of selected friends
      });

      // Navigate to UPI PIN to pay the vendor
      router.push({
        pathname: "/(protected)/upi-pin",
        params: {
          amount: totalAmount.toString(),
          payeeName: payeeName,
          vpa: vpa,
          // After payment, go to the group
          returnTo: `/(protected)/split-group-chat?id=${group.group.id}`,
          transactionType: "vendor_payment",
          splitDetails: JSON.stringify({
            nop: selectedUsers.length + 1,
            perPerson: getSplitAmount(),
          }),
        },
      } as any);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create group");
    }
  };

  const renderFriendItem = ({ item }: { item: any }) => {
    // Structure from useGamification is { friendshipId, id, name... } directly in array?
    // Wait, useGamification friends returns { friends: Friend[] }. Friend has id.
    const friendId = item.id || item._id; 
    const isSelected = selectedUsers.includes(friendId);
    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.userItemSelected]}
        onPress={() => toggleSelection(friendId)}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{item.name[0]}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userPhone}>{item.phone}</Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <MaterialIcons name="check" size={16} color="#0F0F14" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderContactItem = ({ item }: { item: any }) => {
    const id = item.id || item.name; // Fallback ID
    const isSelected = selectedUsers.includes(id);
    const hasImage = item.imageAvailable && item.image?.uri;

    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.userItemSelected]}
        onPress={() => toggleSelection(id)}
      >
        <View style={styles.avatarContainer}>
          {hasImage ? (
            <RNImage source={{ uri: item.image?.uri }} style={styles.avatar} />
          ) : (
            <Text style={styles.avatarText}>
              {item.name ? item.name[0] : "?"}
            </Text>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userPhone}>
            {item.phoneNumbers && item.phoneNumbers[0]
              ? item.phoneNumbers[0].number
              : "No number"}
          </Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <MaterialIcons name="check" size={16} color="#0F0F14" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Split Bill</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "friends" && styles.tabActive]}
          onPress={() => setActiveTab("friends")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "friends" && styles.tabTextActive,
            ]}
          >
            Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "contacts" && styles.tabActive]}
          onPress={() => setActiveTab("contacts")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "contacts" && styles.tabTextActive,
            ]}
          >
            Contacts
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#FF8C32"
            style={{ marginTop: 40 }}
          />
        ) : (
          <FlatList
            data={activeTab === "friends" ? realFriends : contactList}
            keyExtractor={(item: any) =>
              item.id || item.id || Math.random().toString()
            }
            renderItem={
              activeTab === "friends" ? renderFriendItem : renderContactItem
            }
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {activeTab === "friends"
                  ? "No friends found. Add friends to split bills!"
                  : "No contacts found"}
              </Text>
            }
          />
        )}
      </View>

      {/* Footer Summary */}
      <LinearGradient
        colors={["rgba(15, 15, 20, 0)", "#0F0F14"]}
        style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
      >
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryValue}>₹{totalAmount}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.summaryLabel}>
              Per Person ({selectedUsers.length + 1})
            </Text>
            <Text style={[styles.summaryValue, { color: "#FF8C32" }]}>
              ₹{getSplitAmount()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmSplit}
        >
          <Text style={styles.confirmButtonText}>Pay and Create Group</Text>
        </TouchableOpacity>
      </LinearGradient>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#1A1A22",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  tabActive: {
    borderBottomColor: "#FF8C32",
  },
  tabText: {
    color: "#5E5E7D",
    fontSize: 16,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#FF8C32",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  userItemSelected: {
    backgroundColor: "rgba(255, 140, 50, 0.05)",
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2A2A35",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    overflow: "hidden",
  },
  avatar: {
    width: 48,
    height: 48,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  userPhone: {
    color: "#B0B0C3",
    fontSize: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#5E5E7D",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#FF8C32",
    borderColor: "#FF8C32",
  },
  emptyText: {
    color: "#5E5E7D",
    textAlign: "center",
    marginTop: 40,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  summaryLabel: {
    color: "#B0B0C3",
    fontSize: 14,
    marginBottom: 4,
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  confirmButton: {
    backgroundColor: "#FF8C32",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
