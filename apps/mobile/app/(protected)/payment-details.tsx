import { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useUser, getFullAvatarUrl } from "../../hooks/useApi";
import { Image } from "expo-image";

export default function PaymentDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { user } = useUser();
  
  const payeeName = params.payeeName as string || "Unknown Payee";
  const vpa = params.vpa as string || "";
  const initialAmount = params.amount as string || "";
  
  const [amount, setAmount] = useState(initialAmount);
  const [remarks, setRemarks] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Focus amount input after specific delay to not conflict with nav animation
    setTimeout(() => {
        inputRef.current?.focus();
    }, 500);
  }, []);

  const handlePay = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    router.push({
      pathname: "/(protected)/upi-pin",
      params: { 
        payeeName: payeeName,
        amount: amount,
        vpa: vpa
      }
    } as any);
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
        <Text style={styles.headerTitle}>Paying to</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Payee Info */}
        <View style={styles.payeeSection}>
            <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{payeeName.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.payeeName}>{payeeName}</Text>
            <Text style={styles.vpa}>{vpa}</Text>
            
            <View style={styles.bankingNameRow}>
                 <Text style={styles.bankingName}>Banking Name: {payeeName}</Text>
                 <MaterialIcons name="verified" size={14} color="#3DDC97" />
            </View>
        </View>

        {/* Amount Input */}
        <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
                ref={inputRef}
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="numeric"
                cursorColor="#FF8C32"
            />
        </View>

        <TouchableOpacity
            style={[styles.splitButton, (!amount || parseFloat(amount) <= 0) && { opacity: 0.5 }]}
            onPress={() => {
                if (!amount || parseFloat(amount) <= 0) {
                     // Optionally show a toast or alert, or just do nothing (disabled state)
                     // For better UX, we can just block it.
                     return;
                }
                router.push({
                    pathname: "/(protected)/split-bill-selector",
                    params: {
                        amount: amount,
                        payeeName: payeeName,
                        vpa: vpa
                    }
                } as any);
            }}
        >
            <LinearGradient
                colors={["rgba(255, 140, 50, 0.1)", "rgba(255, 140, 50, 0.05)"]}
                style={styles.splitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.splitIconContainer}>
                    <MaterialIcons name="call-split" size={20} color="#FF8C32" />
                </View>
                <View style={styles.splitTextContainer}>
                    <Text style={styles.splitTitle}>Split with friends</Text>
                    <Text style={styles.splitSubtitle}>Share this expense effortlessly</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#5E5E7D" />
            </LinearGradient>
        </TouchableOpacity>

        {/* Remarks */}
        <View style={styles.remarksContainer}>
            <TextInput
                style={styles.remarksInput}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Add a note (Optional)"
                placeholderTextColor="#6B6B7B"
            />
        </View>
      </ScrollView>

      {/* Footer */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <LinearGradient
            colors={["rgba(15, 15, 20, 0)", "#0F0F14"]}
            style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
        >
            {/* From Account Info */}
             <View style={styles.accountInfo}>
                <View style={styles.bankIcon}>
                    <MaterialIcons name="account-balance" size={16} color="#B0B0C3" />
                </View>
                <Text style={styles.accountText}>Debiting from Expense Wallet</Text>
                <Text style={styles.balanceText}>₹{user?.coins?.toLocaleString() || "..."}</Text> 
                {/* Note: Using coins as placeholder for balance since wallets hook not called here for speed */}
            </View>

            <TouchableOpacity 
                style={[styles.payButton, (!amount || parseFloat(amount) <= 0) && styles.payButtonDisabled]}
                onPress={handlePay}
                disabled={!amount || parseFloat(amount) <= 0}
            >
                <Text style={styles.payButtonText}>
                    Pay ₹{amount || "0"}
                </Text>
            </TouchableOpacity>
        </LinearGradient>
      </KeyboardAvoidingView>
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
    color: "#B0B0C3",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  payeeSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FF8C32",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#1A1A22",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  payeeName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  vpa: {
    color: "#B0B0C3",
    fontSize: 14,
  },
  bankingNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    backgroundColor: "rgba(61, 220, 151, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bankingName: {
    color: "#3DDC97",
    fontSize: 12,
    fontWeight: "600",
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  currencySymbol: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "700",
    marginRight: 4,
    opacity: 0.8,
  },
  amountInput: {
    color: "#FFFFFF",
    fontSize: 56,
    fontWeight: "700",
    minWidth: 100,
    textAlign: "center",
  },
  remarksContainer: {
    width: "100%",
    maxWidth: 300,
  },
  splitButton: {
    width: "100%",
    maxWidth: 300,
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 140, 50, 0.2)",
  },
  splitGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  splitIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 140, 50, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  splitTextContainer: {
    flex: 1,
  },
  splitTitle: {
    color: "#FF8C32",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  splitSubtitle: {
    color: "#B0B0C3",
    fontSize: 12,
  },
  remarksInput: {
    backgroundColor: "#1A1A22",
    color: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  bankIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1A1A22",
    alignItems: "center",
    justifyContent: "center",
  },
  accountText: {
    color: "#B0B0C3",
    fontSize: 12,
  },
  balanceText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  payButton: {
    backgroundColor: "#FF8C32",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonDisabled: {
    backgroundColor: "#2A2A35",
    shadowOpacity: 0,
    elevation: 0,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
