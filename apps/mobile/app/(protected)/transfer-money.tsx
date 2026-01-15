import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, ActivityIndicator, Modal, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useWallets, useGoals } from "../../hooks/useApi";
import { PallyIcon } from "../../components/ui/PallyIcon";

export default function TransferMoneyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wallets, loading: walletsLoading, transfer } = useWallets();
  const { goals, addToGoal } = useGoals();
  
  const [amount, setAmount] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  
  // displayGoal is only set when a specific goal is selected
  // null means "Savings Wallet" (distribute to all goals)
  const displayGoal = selectedGoal ? goals?.find(g => g._id === selectedGoal) : null;
  
  // Total amount across all goals (for savings wallet display)
  const totalAllocated = goals?.reduce((sum, g) => sum + (g.currentAmount || 0), 0) || 0;
  
  const expenseBalance = wallets?.primary?.balance || 0;
  const unallocatedSavings = wallets?.savings?.balance || 0;
  const totalSavingsAvailable = unallocatedSavings + totalAllocated;
  
  const [sourceType, setSourceType] = useState<"primary" | "savings">("primary");
  const isDeposit = sourceType === "primary"; // Expense -> Savings
  
  const currentBalance = isDeposit ? expenseBalance : totalSavingsAvailable;
  
  const amountNum = parseInt(amount) || 0;
  
  const handleAddAmount = (value: number) => {
    const current = parseInt(amount) || 0;
    setAmount((current + value).toString());
  };
  
  const handleMax = () => {
    setAmount(currentBalance.toString());
  };

  const handleSwap = () => {
    setSourceType(prev => prev === "primary" ? "savings" : "primary");
    setAmount(""); // Reset amount on swap
    setSelectedGoal(null); // Reset goal selection
    setShowGoalModal(false);
  };
  
  const executeTransfer = async () => {
    setTransferring(true);
    try {
      if (isDeposit) {
        // Expense -> Savings logic
        // First transfer to savings wallet (Unallocated)
        await transfer("primary", "savings", amountNum);
        
        if (selectedGoal) {
          // If a specific goal is selected, add to that goal
          await addToGoal(selectedGoal, amountNum);
          Alert.alert("Success! 🎉", `₹${amountNum} transferred and added to ${displayGoal?.name}!`);
        } else if (goals && goals.length > 0) {
          // Distribute equally among ALL goals
          const amountPerGoal = Math.floor(amountNum / goals.length);
          const remainder = amountNum % goals.length;
          
          // We need to execute these sequentially or all at once
          const promises = goals.map((g, i) => {
             const amt = i === 0 ? amountPerGoal + remainder : amountPerGoal;
             return amt > 0 ? addToGoal(g._id, amt) : Promise.resolve();
          });
          
          await Promise.all(promises);
          
          Alert.alert(
            "Success! 💰", 
            `₹${amountNum} distributed equally to ${goals.length} goals!`
          );
        } else {
          Alert.alert("Success! 💰", `₹${amountNum} transferred to savings!`);
        }
      } else {
        // Savings -> Expense logic (Withdrawal)
        // Pass selectedGoal as sourceGoalId if set
        const result = await transfer("savings", "primary", amountNum, selectedGoal || undefined);
        Alert.alert("Success", result.message || "Withdrawal successful");
      }
      
      router.back();
    } catch (error: any) {
      console.error("Transfer failed:", error);
      Alert.alert("Error", error.message || "Transfer failed");
    } finally {
      setTransferring(false);
    }
  };

  const handleTransfer = async () => {
    if (amountNum <= 0 || amountNum > currentBalance) return;
    
    // Check for withdrawal penalty
    if (!isDeposit) {
       const isPenaltyApplicable = selectedGoal 
         ? !displayGoal?.isCompleted 
         : goals?.some(g => !g.isCompleted);

       if (isPenaltyApplicable) {
         setShowPenaltyModal(true);
         return;
       }
    }

    executeTransfer();
  };
  
  // Calculate after-transfer values
  const newSavingsTotal = isDeposit ? totalSavingsAvailable + amountNum : totalSavingsAvailable - amountNum;
  // Goal progress preview
  const goalProgress = displayGoal
    ? Math.min(100, Math.round(((Math.max(0, displayGoal.currentAmount + (isDeposit ? amountNum : -amountNum))) / displayGoal.targetAmount) * 100))
    : 0;

  if (walletsLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF8C32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back-ios" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Transfer Money</Text>
            <Text style={styles.headerSubtitle}>Move money between your wallets</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 180 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Pally Tip */}
        <LinearGradient
          colors={["#2A2A35", "#1A1A22"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.tipCard}
        >
          <View style={styles.tipIcon}>
            <PallyIcon size={24} />
          </View>
          <Text style={styles.tipText}>
            Smart transfers keep your <Text style={styles.tipHighlight}>streak alive</Text>
          </Text>
        </LinearGradient>

        {/* From/To Wallets */}
        <View style={styles.walletsContainer}>
          
          {/* FROM CARD */}
          {isDeposit ? (
             // FROM: Expense (Fixed)
            <View style={styles.walletCard}>
              <View style={styles.walletLeft}>
                <View style={[styles.walletIcon, { backgroundColor: "rgba(255, 140, 50, 0.1)" }]}>
                  <MaterialIcons name="account-balance-wallet" size={24} color="#FF8C32" />
                </View>
                <View>
                  <Text style={styles.walletLabel}>FROM</Text>
                  <Text style={styles.walletName}>Expense Wallet</Text>
                </View>
              </View>
              <View style={styles.walletRight}>
                <Text style={styles.walletBalance}>₹{expenseBalance.toLocaleString()}</Text>
                <Text style={styles.walletBalanceLabel}>Available</Text>
              </View>
            </View>
          ) : (
             // FROM: Savings/Goal (Selectable)
            <TouchableOpacity 
              style={styles.walletCard}
              onPress={() => setShowGoalModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.walletLeft}>
                <View style={[styles.walletIcon, { backgroundColor: selectedGoal ? `${displayGoal?.color}20` : "rgba(99, 102, 241, 0.1)" }]}>
                   {selectedGoal ? (
                     <Text style={styles.goalEmoji}>{displayGoal?.emoji}</Text>
                   ) : (
                     <MaterialIcons name="savings" size={24} color="#6366F1" />
                   )}
                </View>
                <View>
                  <Text style={styles.walletLabel}>FROM</Text>
                  <Text style={styles.walletName}>
                    {selectedGoal ? displayGoal?.name : "Savings Wallet"}
                  </Text>
                </View>
              </View>
              <View style={styles.walletRight}>
                <Text style={styles.walletBalance}>
                  ₹{(selectedGoal ? (displayGoal?.currentAmount || 0) : totalSavingsAvailable).toLocaleString()}
                </Text>
                <View style={styles.changeRow}>
                   <Text style={styles.walletBalanceLabel}>Tap to change</Text>
                   <MaterialIcons name="keyboard-arrow-down" size={16} color="#B0B0C3" />
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* SWAP ARROW */}
          <View style={styles.arrowContainer}>
            <TouchableOpacity 
              style={styles.arrowCircle}
              onPress={handleSwap}
              activeOpacity={0.8}
            >
              <MaterialIcons name="swap-vert" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* TO CARD */}
          {isDeposit ? (
             // TO: Savings/Goal (Selectable)
            <TouchableOpacity 
              style={styles.walletCard}
              onPress={() => setShowGoalModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.walletLeft}>
                <View style={[styles.walletIcon, { backgroundColor: `${displayGoal?.color || "#6366F1"}20` }]}>
                  <Text style={styles.goalEmoji}>{displayGoal?.emoji || "💰"}</Text>
                </View>
                <View>
                  <Text style={styles.walletLabel}>TO</Text>
                  <Text style={styles.walletName}>{displayGoal?.name || "Savings Wallet"}</Text>
                </View>
              </View>
              <View style={styles.walletRight}>
                <Text style={styles.walletBalance}>
                   {/* If specific goal, show its currentAmount. If Savings Wallet (All), show Total Savings */}
                  ₹{(selectedGoal ? (displayGoal?.currentAmount || 0) : totalSavingsAvailable).toLocaleString()}
                </Text>
                <View style={styles.changeRow}>
                  <Text style={styles.walletBalanceLabel}>Tap to change</Text>
                  <MaterialIcons name="keyboard-arrow-down" size={16} color="#B0B0C3" />
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            // TO: Expense Wallet (Fixed)
            <View style={styles.walletCard}>
              <View style={styles.walletLeft}>
                <View style={[styles.walletIcon, { backgroundColor: "rgba(255, 140, 50, 0.1)" }]}>
                  <MaterialIcons name="account-balance-wallet" size={24} color="#FF8C32" />
                </View>
                <View>
                  <Text style={styles.walletLabel}>TO</Text>
                  <Text style={styles.walletName}>Expense Wallet</Text>
                </View>
              </View>
              <View style={styles.walletRight}>
                <Text style={styles.walletBalance}>₹{expenseBalance.toLocaleString()}</Text>
                <Text style={styles.walletBalanceLabel}>Balance</Text>
              </View>
            </View>
          )}
        </View>

        {/* Amount Input */}
        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.1)"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.quickAmounts}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => handleAddAmount(100)}>
              <Text style={styles.quickBtnText}>+ ₹100</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => handleAddAmount(200)}>
              <Text style={styles.quickBtnText}>+ ₹200</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => handleAddAmount(500)}>
              <Text style={styles.quickBtnText}>+ ₹500</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={handleMax}>
              <Text style={[styles.quickBtnText, { color: "#FF8C32" }]}>MAX</Text>
            </TouchableOpacity>
          </View>
        </View>



        {/* After Transfer Preview */}
        {/* After Transfer Preview */}
        {(displayGoal || !selectedGoal) && (
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>AFTER TRANSFER</Text>
            
            <View style={styles.previewRow}>
              <View style={styles.previewLeft}>
                <View style={[styles.previewDot, !isDeposit && { backgroundColor: "#EF4444" }]} />
                <Text style={styles.previewGoalName}>
                  {selectedGoal ? `${displayGoal?.name} Goal` : "Savings Wallet"}
                </Text>
              </View>
              <Text style={styles.previewAmount}>
                ₹{(selectedGoal ? (displayGoal?.currentAmount || 0) : totalSavingsAvailable).toLocaleString()} → 
                <Text style={styles.previewAmountNew}>
                  ₹{Math.max(0, (selectedGoal ? (displayGoal?.currentAmount || 0) : totalSavingsAvailable) + (isDeposit ? amountNum : -amountNum)).toLocaleString()}
                </Text>
              </Text>
            </View>

            {selectedGoal && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>PROGRESS</Text>
                  <Text style={styles.progressLabel}>{goalProgress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={["#FF8C32", "#FFA24C"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${goalProgress}%` }]}
                  />
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Transfer Button */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={[
            styles.transferButton,
            (amountNum <= 0 || amountNum > currentBalance || transferring) && styles.transferButtonDisabled
          ]}
          onPress={handleTransfer}
          disabled={amountNum <= 0 || amountNum > currentBalance || transferring}
        >
          {transferring ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.transferButtonText}>
               {isDeposit ? "Transfer & Save" : "Withdraw Funds"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Goal Selection Modal */}
      <Modal
        visible={showGoalModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            onPress={() => setShowGoalModal(false)}
            activeOpacity={1}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{isDeposit ? "Choose Destination" : "Choose Source"}</Text>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Savings Wallet Option */}
              <TouchableOpacity 
                style={[styles.goalOption, !selectedGoal && styles.goalOptionSelected]}
                onPress={() => {
                  setSelectedGoal(null);
                  setShowGoalModal(false);
                }}
              >
                <View style={[styles.goalOptionIcon, { backgroundColor: "rgba(99, 102, 241, 0.1)" }]}>
                  <MaterialIcons name="savings" size={24} color="#6366F1" />
                </View>
                <View style={styles.goalOptionInfo}>
                  <Text style={styles.goalOptionName}>Savings Wallet</Text>
                  <Text style={styles.goalOptionBalance}>Current Total: ₹{totalSavingsAvailable.toLocaleString()}</Text>
                  <Text style={{ fontSize: 10, color: "#6366F1", marginTop: 2 }}>
                    {isDeposit ? "Distributes equally to all goals" : "Deducts equally from all goals"}
                  </Text>
                </View>
                {!selectedGoal && <MaterialIcons name="check-circle" size={24} color="#3DDC97" />}
              </TouchableOpacity>

              {/* Goals */}
              {goals?.map(goal => (
                <TouchableOpacity 
                  key={goal._id}
                  style={[styles.goalOption, selectedGoal === goal._id && styles.goalOptionSelected]}
                  onPress={() => {
                    setSelectedGoal(goal._id);
                    setShowGoalModal(false);
                  }}
                >
                  <View style={[styles.goalOptionIcon, { backgroundColor: `${goal.color}20` }]}>
                    <Text style={{ fontSize: 24 }}>{goal.emoji}</Text>
                  </View>
                  <View style={styles.goalOptionInfo}>
                    <Text style={styles.goalOptionName}>{goal.name}</Text>
                    <Text style={styles.goalOptionBalance}>
                      ₹{goal.currentAmount.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}
                    </Text>
                  </View>
                  {selectedGoal === goal._id && <MaterialIcons name="check-circle" size={24} color="#3DDC97" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Penalty Confirmation Modal */}
      <Modal
        visible={showPenaltyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPenaltyModal(false)}
      >
        <View style={[styles.modalOverlay, { justifyContent: "center", padding: 24 }]}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            onPress={() => setShowPenaltyModal(false)}
            activeOpacity={1}
          />
          <View style={[styles.modalContent, { borderRadius: 24, paddingBottom: 24 }]}>
            <View style={{ alignItems: "center", gap: 16 }}>
              <View style={{ 
                width: 64, height: 64, borderRadius: 32, 
                backgroundColor: "rgba(239, 68, 68, 0.1)", 
                alignItems: "center", justifyContent: "center" 
              }}>
                <Text style={{ fontSize: 32 }}>⚠️</Text>
              </View>
              
              <View style={{ alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF" }}>
                  Early Withdrawal
                </Text>
                <Text style={{ fontSize: 14, color: "#B0B0C3", textAlign: "center", lineHeight: 20 }}>
                  You are withdrawing from an incomplete goal. This will cost you <Text style={{ color: "#EF4444", fontWeight: "700" }}>10 Pocket Coins</Text>.
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 12, marginTop: 8, width: "100%" }}>
                <TouchableOpacity 
                  style={{ flex: 1, padding: 16, borderRadius: 16, backgroundColor: "#2A2A35", alignItems: "center" }}
                  onPress={() => setShowPenaltyModal(false)}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ flex: 1, padding: 16, borderRadius: 16, backgroundColor: "#EF4444", alignItems: "center" }}
                  onPress={() => {
                    setShowPenaltyModal(false);
                    executeTransfer();
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Confirm</Text>
                </TouchableOpacity>
              </View>
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
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: "rgba(15, 15, 20, 0.95)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A22",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#B0B0C3",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 24,
    paddingBottom: 24,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#0F0F14",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  tipEmoji: {
    fontSize: 24,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
  },
  tipHighlight: {
    color: "#FF8C32",
    fontWeight: "700",
  },
  walletsContainer: {
    alignItems: "center",
    gap: 0,
  },
  walletCard: {
    width: "100%",
    backgroundColor: "#1A1A22",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  goalEmoji: {
    fontSize: 24,
  },
  walletLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B0B0C3",
    letterSpacing: 1,
  },
  walletName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  walletRight: {
    alignItems: "flex-end",
  },
  walletBalance: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  walletBalanceLabel: {
    fontSize: 10,
    color: "#B0B0C3",
  },
  arrowContainer: {
    zIndex: 10,
    marginVertical: -16,
  },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF8C32",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#0F0F14",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  amountSection: {
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currencySymbol: {
    fontSize: 48,
    fontWeight: "800",
    color: "rgba(255,255,255,0.2)",
    fontStyle: "italic",
  },
  amountInput: {
    fontSize: 56,
    fontWeight: "800",
    color: "#FFFFFF",
    fontStyle: "italic",
    minWidth: 100,
    textAlign: "center",
  },
  quickAmounts: {
    flexDirection: "row",
    gap: 8,
  },
  quickBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#1A1A22",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  previewCard: {
    backgroundColor: "rgba(26,26,34,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B0B0C3",
    letterSpacing: 1,
    marginBottom: 16,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  previewLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF8C32",
  },
  previewGoalName: {
    fontSize: 14,
    color: "#B0B0C3",
  },
  previewAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#B0B0C3",
  },
  previewAmountNew: {
    color: "#3DDC97",
  },
  progressSection: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B0B0C3",
    letterSpacing: 0.5,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#0F0F14",
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#0F0F14",
  },
  transferButton: {
    backgroundColor: "#FF8C32",
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 10,
  },
  transferButtonDisabled: {
    opacity: 0.5,
  },
  transferButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1A1A22",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  goalOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#0F0F14",
    borderRadius: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  goalOptionSelected: {
    borderColor: "#3DDC97",
    backgroundColor: "rgba(61, 220, 151, 0.1)",
  },
  goalOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  goalOptionInfo: {
    flex: 1,
    gap: 4,
  },
  goalOptionName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  goalOptionBalance: {
    fontSize: 12,
    color: "#B0B0C3",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalScroll: {
    maxHeight: 300,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 140, 50, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 140, 50, 0.2)",
  },
  infoText: {
    color: "#E0E0E0",
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});

