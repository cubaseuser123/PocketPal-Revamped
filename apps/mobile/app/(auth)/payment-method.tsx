import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type PaymentMethod = "upi" | "debit" | "netbanking" | null;

export default function PaymentMethodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("upi");

  const { amount } = useLocalSearchParams<{ amount: string }>();

  const handleContinue = () => {
    // Navigate to onboarding success screen
    router.replace({
      pathname: "/(auth)/onboarding-success",
      params: { amount }
    });
  };

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
          <Text style={styles.title}>Choose payment method</Text>
        </View>

        {/* Payment Options */}
        <View style={styles.optionsContainer}>
          {/* UPI - Recommended */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedMethod === "upi" && styles.paymentOptionSelected,
            ]}
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
                  <Text
                    style={[
                      styles.optionTitle,
                      selectedMethod === "upi" && styles.optionTitleSelected,
                    ]}
                  >
                    UPI
                  </Text>
                </View>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>RECOMMENDED</Text>
                </View>
              </View>
              <Text style={styles.optionDescription}>
                Google Pay, PhonePe, Paytm, BHIM
              </Text>
            </View>
            {selectedMethod === "upi" && <View style={styles.selectedOverlay} />}
          </TouchableOpacity>

          {/* Debit Card */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedMethod === "debit" && styles.paymentOptionSelected,
            ]}
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
                  <Text
                    style={[
                      styles.optionTitle,
                      selectedMethod === "debit" && styles.optionTitleSelected,
                    ]}
                  >
                    Debit Card
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#4B5563" />
              </View>
              <Text style={styles.optionDescription}>
                All major banks supported
              </Text>
            </View>
          </TouchableOpacity>

          {/* Net Banking */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedMethod === "netbanking" && styles.paymentOptionSelected,
            ]}
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
                  <Text
                    style={[
                      styles.optionTitle,
                      selectedMethod === "netbanking" && styles.optionTitleSelected,
                    ]}
                  >
                    Net Banking
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#4B5563" />
              </View>
              <Text style={styles.optionDescription}>
                Login via your bank
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info text */}
        <Text style={styles.infoText}>
          You can use any bank or UPI app.
        </Text>
      </View>

      {/* Bottom Button */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 32 }]}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.2)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonShimmer}
          />
          <Text style={styles.buttonText}>Continue</Text>
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
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  optionsContainer: {
    gap: 16,
  },
  paymentOption: {
    backgroundColor: "#1A1A22",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 20,
    overflow: "hidden",
  },
  paymentOptionSelected: {
    borderWidth: 2,
    borderColor: "#FF8C32",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  selectedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 140, 50, 0.05)",
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
    fontSize: 18,
    fontWeight: "700",
    color: "#E5E7EB",
  },
  optionTitleSelected: {
    color: "#FFFFFF",
  },
  recommendedBadge: {
    backgroundColor: "rgba(255, 140, 50, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 140, 50, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FF8C32",
    letterSpacing: 0.5,
  },
  optionDescription: {
    fontSize: 13,
    fontWeight: "500",
    color: "#B0B0C3",
    marginLeft: 30,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#B0B0C3",
    textAlign: "center",
    marginTop: 32,
  },
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
