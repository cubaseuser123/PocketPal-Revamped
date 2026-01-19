import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from "react-native";
import { useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useUser } from "../../hooks/useApi";

export default function TransferSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { refetch } = useUser();
  
  const amount = params.amount as string || "0";
  const recipient = params.recipient as string || "Unknown";
  const transactionId = params.transactionId as string || "TXN" + Date.now();
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Refresh user data (balance) in background
    refetch();

    // Animation sequence
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.elastic(1.2),
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const returnTo = params.returnTo as string;
  
  // ... (animations remain same)

  const handleDone = () => {
    if (returnTo) {
        router.replace(returnTo as any);
    } else {
        router.replace("/(protected)/(tabs)");
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        
        {/* Success Icon */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={["#4ADE80", "#22C55E"]}
            style={styles.iconGradient}
          >
            <MaterialIcons name="check" size={64} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.detailsContainer, { opacity: fadeAnim }]}>
          <Text style={styles.successText}>Payment Successful!</Text>
          
          <Text style={styles.amountText}>₹{amount}</Text>
          
          <View style={styles.recipientContainer}>
            <Text style={styles.toLabel}>Paid to</Text>
            <Text style={styles.recipientName}>{recipient}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Transaction ID</Text>
            <Text style={styles.value}>{transactionId}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{new Date().toLocaleString()}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Payment Mode</Text>
            <Text style={styles.value}>UPI</Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { paddingBottom: insets.bottom + 20, opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={styles.doneButton} 
          onPress={handleDone}
        >
          <Text style={styles.doneButtonText}>{returnTo ? "Back to Group" : "Done"}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F14",
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 32,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#1A1A22",
  },
  detailsContainer: {
    width: "100%",
    alignItems: "center",
  },
  successText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  amountText: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "700",
    marginBottom: 32,
    fontStyle: "italic",
  },
  recipientContainer: {
    alignItems: "center",
    marginBottom: 32,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  toLabel: {
    color: "#B0B0C3",
    fontSize: 12,
    marginBottom: 4,
  },
  recipientName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  label: {
    color: "#B0B0C3",
    fontSize: 14,
  },
  value: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    paddingHorizontal: 20,
  },
  doneButton: {
    backgroundColor: "#22C55E",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
