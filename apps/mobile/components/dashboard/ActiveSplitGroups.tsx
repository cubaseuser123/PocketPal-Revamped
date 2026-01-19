import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import { useSplitGroups, useUser } from "../../hooks/useApi";

export function ActiveSplitGroups() {
  const router = useRouter();
  const { user } = useUser();
  const { groups, loading } = useSplitGroups();

// Filter out settled groups for Dashboard view
  const activeGroups = groups.filter((g) => g.status !== "settled");

  if (loading || !activeGroups.length) return null;

  const handlePress = (group: any) => {
    const isCreator = group.creator === user?.id; // user might need strict check if population happened? No, default is ID.
    // However, if population happened, creator would be obj. 
    // Safest is to check if typeof creator === string ? creator : creator._id
    
    // For listUserGroups, it is NOT populated.
    const role = isCreator ? "payer" : "ower";
    const perPerson = Math.round(group.totalAmount / group.members.length); 

    router.push({
        pathname: "/(protected)/split-group-chat",
        params: {
            id: group._id, // Pass ID for fetching details
            amount: group.totalAmount.toString(),
            payeeName: group.name,
            vpa: "group@upi", // Placeholder
            splitDetails: JSON.stringify({
                totalAmount: group.totalAmount,
                nop: group.members.length,
                perPerson: perPerson,
                participants: [] // Fetched in chat
            }),
            status: group.status === "settled" ? "paid" : "draft", // Map 'settled' -> 'paid' for UI
            role: role
        }
    } as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Split Groups</Text>
        <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
      >
        {activeGroups.map((group: any) => {
            const isCreator = group.creator === user?.id;
            const role = isCreator ? "payer" : "ower";
            // Map 'active' -> 'unpaid', 'settled' -> 'paid'
            const status = group.status === "settled" ? "paid" : "unpaid";
            const myShare = Math.round(group.totalAmount / group.members.length);

            return (
            <TouchableOpacity 
                key={group._id} 
                onPress={() => handlePress(group)}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={["#1A1A22", "#15151A"]}
                    style={styles.card}
                >
                    <View style={styles.iconRow}>
                        <View style={[styles.iconBox, (status === "paid" || group.myStatus === "paid") ? styles.iconPaid : styles.iconUnpaid]}>
                            <MaterialIcons 
                                name={(status === "paid" || group.myStatus === "paid") ? "check" : "access-time"} 
                                size={16} 
                                color={(status === "paid" || group.myStatus === "paid") ? "#3DDC97" : "#FF8C32"} 
                            />
                        </View>
                        
                        {/* Wrapper for Badges */}
                        {group.myStatus === "collecting" && (
                             <View style={[styles.badge, { backgroundColor: "rgba(41, 98, 255, 0.1)" }]}>
                                <Text style={[styles.badgeText, { color: "#448AFF" }]}>Collecting</Text>
                             </View>
                        )}

                        {group.myStatus === "pending" && (
                             <View style={styles.badge}>
                                <Text style={styles.badgeText}>Action Needed</Text>
                             </View>
                        )}
                        
                        {group.myStatus === "paid" && (
                             <View style={[styles.badge, { backgroundColor: "rgba(61, 220, 151, 0.1)" }]}>
                                <Text style={[styles.badgeText, { color: "#3DDC97" }]}>Paid</Text>
                             </View>
                        )}
                    </View>
                    
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.amount}>₹{myShare} <Text style={styles.subText}>/ share</Text></Text>
                    
                    <View style={styles.membersRow}>
                        <MaterialIcons name="group" size={14} color="#757575" />
                        <Text style={styles.membersText}>You + {group.members.length - 1}</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
            );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  seeAll: {
    fontSize: 12,
    color: "#FF8C32",
    fontWeight: "600",
  },
  card: {
      width: 160,
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.05)",
  },
  iconRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
  },
  iconBox: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
  },
  iconUnpaid: {
      backgroundColor: "rgba(255, 140, 50, 0.1)",
  },
  iconPaid: {
      backgroundColor: "rgba(61, 220, 151, 0.1)",
  },
  badge: {
      backgroundColor: "rgba(255, 140, 50, 0.1)",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: "center"
  },
  badgeText: {
      fontSize: 10,
      color: "#FF8C32",
      fontWeight: "700"
  },
  groupName: {
      fontSize: 14,
      fontWeight: "600",
      color: "#FFFFFF",
      marginBottom: 4,
  },
  amount: {
      fontSize: 18,
      fontWeight: "700",
      color: "#FFFFFF",
      marginBottom: 8,
  },
  subText: {
      fontSize: 12,
      fontWeight: "400",
      color: "#757575",
  },
  membersRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4
  },
  membersText: {
      fontSize: 12,
      color: "#757575"
  }
});
