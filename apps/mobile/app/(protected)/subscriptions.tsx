import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useSubscriptions } from "../../hooks/useApi";

export default function SubscriptionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { subscriptions, loading, addSubscription, cancelSubscription, refetch } = useSubscriptions();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubPrice, setNewSubPrice] = useState("");
  const [newSubDate, setNewSubDate] = useState(new Date().toISOString().split('T')[0]); // Default to today YYYY-MM-DD
  const [newSubCycle, setNewSubCycle] = useState("monthly");
  const [adding, setAdding] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleAddSubscription = async () => {
    if (!newSubName || !newSubPrice || !newSubDate) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setAdding(true);
    try {
      await addSubscription({
        name: newSubName,
        price: parseFloat(newSubPrice),
        startDate: newSubDate,
        renewalCycle: newSubCycle,
        category: "general"
      });
      setIsModalVisible(false);
      setNewSubName("");
      setNewSubPrice("");
      setNewSubCycle("monthly");
      // Refetch is handled by query invalidation in hook
    } catch (error) {
      Alert.alert("Error", "Failed to add subscription");
    } finally {
      setAdding(false);
    }
  };

  const handleCancelSubscription = (id: string, name: string) => {
    Alert.alert(
      "Cancel Subscription",
      `Are you sure you want to cancel ${name}?`,
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: async () => {
             try {
               await cancelSubscription(id);
             } catch (e) {
               Alert.alert("Error", "Failed to cancel subscription");
             }
          }
        }
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
        <Text style={styles.headerTitle}>Subscriptions</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => setIsModalVisible(true)}>
          <MaterialIcons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FF8C32" style={{ marginTop: 40 }} />
        ) : subscriptions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="subscriptions" size={64} color="#2A2A35" />
            <Text style={styles.emptyText}>No active subscriptions</Text>
            <Text style={styles.emptySubtext}>Add your subscriptions to track recurring expenses</Text>
          </View>
        ) : (
          subscriptions.map((sub) => (
            <View key={sub._id} style={styles.subCard}>
              <View style={styles.subIcon}>
                <Text style={styles.subEmoji}>📅</Text>
              </View>
              <View style={styles.subInfo}>
                <Text style={styles.subName}>{sub.name}</Text>
                <Text style={styles.subCycle}>{sub.renewalCycle} • Next: {new Date(sub.nextRenewal).toLocaleDateString()}</Text>
              </View>
              <View style={styles.subRight}>
                <Text style={styles.subPrice}>-₹{sub.price}</Text>
                <TouchableOpacity onPress={() => handleCancelSubscription(sub._id, sub.name)}>
                  <MaterialIcons name="cancel" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Subscription Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Subscription</Text>
            
            <TextInput 
              style={styles.input}
              placeholder="Name (e.g. Netflix)"
              placeholderTextColor="#666"
              value={newSubName}
              onChangeText={setNewSubName}
            />
            
            <TextInput 
              style={styles.input}
              placeholder="Price (₹)"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={newSubPrice}
              onChangeText={setNewSubPrice}
            />

            <TextInput 
              style={styles.input}
              placeholder="Start Date (YYYY-MM-DD)"
              placeholderTextColor="#666"
              value={newSubDate}
              onChangeText={setNewSubDate}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.addButton]} 
                onPress={handleAddSubscription}
                disabled={adding}
              >
                {adding ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Add</Text>
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
    padding: 20,
    gap: 16,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 100,
    gap: 12,
  },
  emptyText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  subCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C23",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  subIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  subEmoji: {
    fontSize: 20,
  },
  subInfo: {
    flex: 1,
  },
  subName: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  subCycle: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
    textTransform: "capitalize",
  },
  subRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  subPrice: {
    color: "#FFF",
    fontSize: 16,
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
  cancelButton: {
    backgroundColor: "#2A2A35",
  },
  addButton: {
    backgroundColor: "#FF8C32",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
