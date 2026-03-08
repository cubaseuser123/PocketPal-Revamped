import { View, Text, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface AddMoneyContentProps {
  isLimited: boolean;
}

export function AddMoneyContent({ isLimited }: AddMoneyContentProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState("500");

  const handleAddMoney = () => {
    if (!amount || parseInt(amount) < 1) return;
    if (isLimited) {
      router.push("/(auth)/payment-method");
    } else {
      router.push({
        pathname: "/(auth)/payment-method",
        params: { amount },
      });
    }
  };

  const formatAmount = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    setAmount(numericValue);
  };

  const displayAmount = amount ? `₹${amount}` : "";
  const isDisabled = !amount || parseInt(amount) < 1;

  return (
    <View style={styles.container}>
      {/* Background glows */}
      <LinearGradient
        colors={["rgba(255, 140, 50, 0.05)", "transparent"]}
        style={styles.topGlow}
      />
      <View style={styles.bottomGlow} />
      <View style={styles.leftGlow} />

      {/* Main content */}
      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>
            Add money to your{"\n"}Expense Wallet
          </Text>
          <Text style={styles.subtitle}>
            This is your weekly allowance,{"\n"}not your entire balance.
          </Text>
        </View>

        {/* Amount Input Section */}
        <View style={styles.amountSection}>
          <View style={styles.amountContainer}>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={formatAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="rgba(255, 255, 255, 0.2)"
                maxLength={6}
                selectTextOnFocus
              />
            </View>
          </View>
        </View>

        {/* Conditional content: Feature List OR Limited Access Warning */}
        {isLimited ? (
          <View style={styles.limitedAccessCard}>
            <View style={styles.limitedAccessHeader}>
              <MaterialIcons name="lock" size={20} color="#FFD166" />
              <Text style={styles.limitedAccessTitle}>Limited Access</Text>
            </View>
            <Text style={styles.limitedAccessText}>
              Without KYC, you will still earn rewards but won't be able to pay merchants or withdraw savings yet. You can do it anytime!
            </Text>
          </View>
        ) : (
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔒</Text>
              <Text style={styles.featureText}>Regulated wallet</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>↩</Text>
              <Text style={styles.featureText}>Withdraw anytime</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🧾</Text>
              <Text style={styles.featureText}>Full transaction history</Text>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Button */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 32 }]}>
        <TouchableOpacity
          style={[styles.button, isDisabled && styles.buttonDisabled]}
          onPress={handleAddMoney}
          activeOpacity={0.8}
          disabled={isDisabled}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.2)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonShimmer}
          />
          <Text style={styles.buttonText}>Add {displayAmount || "₹0"}</Text>
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
  leftGlow: {
    position: "absolute",
    top: "20%",
    left: "-10%",
    width: 192,
    height: 192,
    backgroundColor: "rgba(255, 140, 50, 0.05)",
    borderRadius: 96,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#B0B0C3",
    textAlign: "center",
    lineHeight: 22,
  },
  amountSection: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  amountContainer: {
    width: "100%",
    maxWidth: 280,
  },
  amountInputContainer: {
    backgroundColor: "#1A1A22",
    borderWidth: 2,
    borderColor: "#FF8C32",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  currencySymbol: {
    fontSize: 40,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  amountInput: {
    fontSize: 40,
    fontWeight: "700",
    color: "#FFFFFF",
    minWidth: 60,
    textAlign: "center",
    padding: 0,
  },
  // Feature list (non-limited)
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#1A1A22",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  featureIcon: {
    fontSize: 18,
  },
  featureText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#D0D0DD",
  },
  // Limited access card
  limitedAccessCard: {
    backgroundColor: "rgba(255, 209, 102, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 209, 102, 0.2)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  limitedAccessHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  limitedAccessTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFD166",
  },
  limitedAccessText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#B0B0C3",
    lineHeight: 22,
  },
  // Bottom button
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  button: {
    backgroundColor: "#FF8C32",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  buttonDisabled: {
    backgroundColor: "#2A2A35",
    shadowOpacity: 0,
  },
  buttonShimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
