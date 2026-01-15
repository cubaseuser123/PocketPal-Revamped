import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useGoals } from "../../hooks/useApi";

export default function GoalDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const { goals, loading, deleteGoal, addToGoal, updateGoal } = useGoals();
  const [adding, setAdding] = useState(false);
  
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [updating, setUpdating] = useState(false);
  
  const goal = goals?.find(g => g._id === params.id);

  // Initialize edit state when goal is found (or when modal opens, handled in useEffect/handler conceptually, 
  // but simpler to just set defaults or use effects. Let's use a side effect for simplicity or just init when button pressed)
  // Actually, better to just set it when button is pressed. Let's update the button press handler.
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF8C32" />
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Goal not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = goal.targetAmount > 0 
    ? (goal.currentAmount / goal.targetAmount) * 100 
    : 0;
  const remaining = goal.targetAmount - goal.currentAmount;

  const handleAddMoney = async (amount: number) => {
    setAdding(true);
    try {
      await addToGoal(goal._id, amount);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add money");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Goal",
      `Are you sure you want to delete "${goal.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGoal(goal._id);
              router.back();
            } catch (error) {
              Alert.alert("Error", "Failed to delete goal");
            }
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Goal Details</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => {
              if (goal) {
                setEditName(goal.name);
                setEditAmount(goal.targetAmount.toString());
                setIsEditModalVisible(true);
              }
            }}
          >
            <MaterialIcons name="edit" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <MaterialIcons name="delete-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Goal Icon and Name */}
        <View style={[styles.iconCard, { borderColor: goal.color }]}>
          <View style={[styles.iconCircle, { backgroundColor: `${goal.color}20` }]}>
            <Text style={styles.iconEmoji}>{goal.emoji}</Text>
          </View>
          <Text style={styles.goalName}>{goal.name}</Text>
          <Text style={styles.goalCategory}>{goal.category}</Text>
        </View>

        {/* Progress Section */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={[styles.progressPercent, { color: goal.color }]}>
              {progress.toFixed(0)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={[goal.color, goal.color]}
              style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <View style={styles.amountsRow}>
            <View>
              <Text style={styles.amountLabel}>Saved</Text>
              <Text style={styles.amountValue}>₹{goal.currentAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.amountRight}>
              <Text style={styles.amountLabel}>Target</Text>
              <Text style={styles.amountValue}>₹{goal.targetAmount.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Remaining Card */}
        <View style={styles.remainingCard}>
          <Text style={styles.remainingLabel}>Remaining to reach your goal</Text>
          <Text style={[styles.remainingAmount, { color: goal.color }]}>
            ₹{remaining.toLocaleString()}
          </Text>
        </View>

        {/* Quick Add Buttons */}
        <View style={styles.quickAddSection}>
          <Text style={styles.sectionTitle}>QUICK ADD</Text>
          <View style={styles.quickAddButtons}>
            {[100, 500, 1000, 2000].map(amount => (
              <TouchableOpacity 
                key={amount}
                style={styles.quickAddBtn}
                onPress={() => handleAddMoney(amount)}
                disabled={adding}
              >
                <Text style={styles.quickAddText}>+₹{amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Add Button */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: goal.color }]}
          onPress={() => handleAddMoney(500)}
          disabled={adding}
        >
          {adding ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.addButtonText}>Add Money to Goal</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F14",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#B0B0C3",
    fontSize: 16,
    marginBottom: 16,
  },
  backLink: {
    color: "#FF8C32",
    fontSize: 14,
    fontWeight: "600",
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
    borderRadius: 20,
    backgroundColor: "#1A1A22",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 20,
  },
  iconCard: {
    backgroundColor: "#1A1A22",
    borderRadius: 24,
    borderWidth: 2,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 40,
  },
  goalName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  goalCategory: {
    fontSize: 14,
    color: "#B0B0C3",
  },
  progressCard: {
    backgroundColor: "#1A1A22",
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B0B0C3",
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: "800",
  },
  progressBar: {
    height: 12,
    backgroundColor: "#0F0F14",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  amountsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  amountRight: {
    alignItems: "flex-end",
  },
  amountLabel: {
    fontSize: 12,
    color: "#B0B0C3",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  remainingCard: {
    backgroundColor: "#1A1A22",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  remainingLabel: {
    fontSize: 12,
    color: "#B0B0C3",
  },
  remainingAmount: {
    fontSize: 28,
    fontWeight: "800",
  },
  quickAddSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B0B0C3",
    letterSpacing: 1,
  },
  quickAddButtons: {
    flexDirection: "row",
    gap: 12,
  },
  quickAddBtn: {
    flex: 1,
    backgroundColor: "#1A1A22",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  quickAddText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#0F0F14",
  },
  addButton: {
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
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
