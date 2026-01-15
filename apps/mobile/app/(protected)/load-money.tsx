import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useWallets } from "../../hooks/useApi";

type PaymentMethod = "upi" | "debit" | "netbanking" | null;

export default function LoadMoneyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wallets, addMoney } = useWallets();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("upi");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Quick amounts
  const quickAmounts = [100, 200, 500, 1000];

  const handleAddMoney = async (value: number) => {
    if (value <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      await addMoney(value);
      Alert.alert("Success! 🎉", `₹${value} added to your Expense Wallet!`);
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add money");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    const amountNum = parseInt(amount) || 0;
    if (amountNum <= 0) {
      Alert.alert("Invalid Amount", "Please enter an amount greater than 0");
      return;
    }
    handleAddMoney(amountNum);
  };

  const handleQuickAdd = (amt: number) => {
    setAmount(amt.toString());
  };

  return (
    <View style={styles.container}>
      {/* Background glows */}
      <LinearGradient
        colors={["rgba(255, 140, 50, 0.05)", "transparent"]}
        style={styles.topGlow}
      />
      <View style={styles.bottomGlow} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back-ios" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Add Money</Text>
            <Text style={styles.headerSubtitle}>Load money to your wallet</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>EXPENSE WALLET</Text>
          <Text style={styles.balanceAmount}>
            ₹{wallets?.primary?.balance?.toLocaleString() || 0}
          </Text>
        </View>

        {/* Amount Input */}
        <View style={styles.amountSection}>
          <Text style={styles.sectionTitle}>Enter amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.2)"
              keyboardType="numeric"
            />
          </View>
          
          {/* Quick Amount Chips */}
          <View style={styles.quickChips}>
            {quickAmounts.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[styles.quickChip, amount === amt.toString() && styles.quickChipSelected]}
                onPress={() => handleQuickAdd(amt)}
              >
                <Text style={[styles.quickChipText, amount === amt.toString() && styles.quickChipTextSelected]}>
                  + ₹{amt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Options */}
        <Text style={styles.sectionTitle}>Payment method</Text>
        <View style={styles.optionsContainer}>
          {/* UPI */}
          <TouchableOpacity
            style={[styles.paymentOption, selectedMethod === "upi" && styles.paymentOptionSelected]}
            onPress={() => setSelectedMethod("upi")}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionHeader}>
                <View style={styles.optionTitleRow}>
                  <MaterialIcons
                    name="qr-code-scanner"
                    size={22}
                    color={selectedMethod === "upi" ? "#FF8C32" : "#9CA3AF"}
                  />
                  <Text style={[styles.optionTitle, selectedMethod === "upi" && styles.optionTitleSelected]}>
                    UPI
                  </Text>
                </View>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>RECOMMENDED</Text>
                </View>
              </View>
              <Text style={styles.optionDescription}>Google Pay, PhonePe, Paytm, BHIM</Text>
            </View>
          </TouchableOpacity>

          {/* Debit/Credit Card */}
          <TouchableOpacity
            style={[styles.paymentOption, selectedMethod === "debit" && styles.paymentOptionSelected]}
            onPress={() => setSelectedMethod("debit")}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionHeader}>
                <View style={styles.optionTitleRow}>
                  <MaterialIcons
                    name="credit-card"
                    size={22}
                    color={selectedMethod === "debit" ? "#FF8C32" : "#9CA3AF"}
                  />
                  <Text style={[styles.optionTitle, selectedMethod === "debit" && styles.optionTitleSelected]}>
                    Debit/Credit Card
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#4B5563" />
              </View>
              <Text style={styles.optionDescription}>All major cards supported</Text>
            </View>
          </TouchableOpacity>

          {/* Net Banking */}
          <TouchableOpacity
            style={[styles.paymentOption, selectedMethod === "netbanking" && styles.paymentOptionSelected]}
            onPress={() => setSelectedMethod("netbanking")}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionHeader}>
                <View style={styles.optionTitleRow}>
                  <MaterialIcons
                    name="account-balance"
                    size={22}
                    color={selectedMethod === "netbanking" ? "#FF8C32" : "#9CA3AF"}
                  />
                  <Text style={[styles.optionTitle, selectedMethod === "netbanking" && styles.optionTitleSelected]}>
                    Net Banking
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#4B5563" />
              </View>
              <Text style={styles.optionDescription}>Login via your bank</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Continue Button - Fixed at bottom */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.continueButton, (!amount || loading) && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!amount || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueButtonText}>
              {amount ? `Add ₹${parseInt(amount).toLocaleString()}` : "Enter amount"}
            </Text>
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
  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
  bottomGlow: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 256,
    height: 256,
    backgroundColor: "rgba(255, 140, 50, 0.05)",
    borderRadius: 128,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
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
    paddingHorizontal: 24,
    gap: 24,
  },
  balanceCard: {
    backgroundColor: "#1A1A22",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B0B0C3",
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
  amountSection: {
    gap: 12,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  currencySymbol: {
    fontSize: 48,
    fontWeight: "800",
    color: "rgba(255,255,255,0.3)",
  },
  amountInput: {
    fontSize: 56,
    fontWeight: "800",
    color: "#FFFFFF",
    minWidth: 100,
    textAlign: "center",
  },
  quickChips: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  quickChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#1A1A22",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  quickChipSelected: {
    borderColor: "#FF8C32",
    backgroundColor: "rgba(255, 140, 50, 0.1)",
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  quickChipTextSelected: {
    color: "#FF8C32",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 12,
  },
  paymentOption: {
    backgroundColor: "#1A1A22",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
  },
  paymentOptionSelected: {
    borderWidth: 2,
    borderColor: "#FF8C32",
  },
  optionContent: {
    gap: 4,
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E5E7EB",
  },
  optionTitleSelected: {
    color: "#FFFFFF",
  },
  recommendedBadge: {
    backgroundColor: "rgba(255, 140, 50, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FF8C32",
    letterSpacing: 0.5,
  },
  optionDescription: {
    fontSize: 12,
    color: "#B0B0C3",
    marginLeft: 30,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: "#0F0F14",
  },
  continueButton: {
    backgroundColor: "#FF8C32",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  quickContainer: {
    flexDirection: "row",
    gap: 12,
  },
  quickButton: {
    flex: 1,
    backgroundColor: "#FF8C32",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  quickButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

