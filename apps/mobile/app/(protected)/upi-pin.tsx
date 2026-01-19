import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Vibration,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useWallets, useTransactions, API_URL } from "../../hooks/useApi";
import { pocketPalApi } from "@repo/auth";
import { Image } from "expo-image";

export default function UpiPinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { transfer } = useWallets();
  const { addTransaction } = useTransactions();

  const payeeName = (params.payeeName as string) || "Unknown";
  const amount = (params.amount as string) || "0";
  const vpa = (params.vpa as string) || "";
  const splitDetailsString = params.splitDetails as string;
  const splitDetails = splitDetailsString
    ? JSON.parse(splitDetailsString)
    : null;
  const returnTo = params.returnTo as string;
  const transactionType = params.transactionType as string; // "regular" | "split_bill"
  const groupId = params.groupId as string;

  const [pin, setPin] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePress = (num: string) => {
    if (loading) return;
    if (pin.length < 6) {
      setPin([...pin, num]);
      // Haptic feedback could go here
    }
  };

  const handleBackspace = () => {
    if (loading) return;
    setPin(pin.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length !== 6) return;

    setLoading(true);

    // Simulate API delay for realism
    // setTimeout(async () => {
    try {
      // Real Backend Integration
      const parsedAmount = parseFloat(amount);

      let resultTransaction;

      if (transactionType === "split_bill" && groupId) {
         // Call Split Group Pay API
         const response = await pocketPalApi.splitGroups.pay(API_URL, groupId, parsedAmount);
         resultTransaction = response.transaction || { _id: "TXN_SPLIT_" + Date.now(), createdAt: new Date().toISOString() };
      } else {
         // Regular Transaction
         const transactionName = splitDetails ? `Paid to ${payeeName} (Split Group)` : `Paid to ${payeeName}`;
         const data = await addTransaction(
            transactionName, 
            -parsedAmount, 
            undefined, 
            "primary", 
            "💸", 
         );
         resultTransaction = data.transaction;
      }

      // Successfully paid. 

      // Navigate to success
      router.replace({
        pathname: "/(protected)/transfer-success",
        params: {
          amount: amount,
          recipient: payeeName,
          transactionId: resultTransaction._id,
          timestamp: resultTransaction.createdAt,
          splitCount: splitDetails?.nop, // Pass param to show split info in success
          returnTo: returnTo, // Pass it forward
          // Data persistence for return flow
          splitDetails: splitDetailsString,
          payeeName: payeeName,
          vpa: vpa
        },
      } as any);
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Payment Failed",
        (error as Error).message || "Transaction failed",
      );
      setLoading(false);
      setPin([]);
    }
    // }, 2000);
  };

  return (
    <View style={styles.container}>
      {/* Top Bar: Bank/UPI Info */}
      <View style={[styles.header, { marginTop: insets.top }]}>
        <View style={styles.bankInfo}>
          {/* User requested ONLY UPI Logo, no bank name */}
        </View>
        <Image
          source={{
            uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/2560px-UPI-Logo-vector.svg.png",
          }}
          style={{ width: 60, height: 18 }}
          contentFit="contain"
        />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Header Row */}
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>ENTER 6-DIGIT UPI PIN</Text>
          {/* Dropdown arrow visual */}
          <MaterialIcons name="keyboard-arrow-down" size={24} color="#000" />
        </View>

        {/* Payee Info */}
        <View style={styles.payeeInfo}>
          <View style={styles.payeeRow}>
            <Text style={styles.payeeLabel}>To: </Text>
            <Text style={styles.payeeName}>{payeeName}</Text>
          </View>
          <View style={styles.payeeRow}>
            <Text style={styles.payeeLabel}>Sending: </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.amountText}>₹{amount}</Text>
              {splitDetails && (
                <Text style={{ fontSize: 12, color: "#757575" }}>
                  Your Share: ₹{splitDetails.perPerson}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* PIN Dots */}
        <View style={styles.dotsContainer}>
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              style={[styles.dotLine, pin[i] ? styles.dotFilled : null]}
            >
              {pin[i] && <View style={styles.dotCircle} />}
            </View>
          ))}
        </View>

        {/* Loading Indicator Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Processing Payment...</Text>
          </View>
        )}
      </View>

      {/* Safe Payment Footer */}
      <View style={styles.secureFooter}>
        <MaterialIcons name="verified-user" size={16} color="#00C853" />
        <Text style={styles.secureText}>
          UPI PIN is kept secure by your bank
        </Text>
      </View>

      {/* Numeric Keypad */}
      <View style={[styles.keypad, { paddingBottom: insets.bottom + 10 }]}>
        {[
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ].map((row, i) => (
          <View key={i} style={styles.keyRow}>
            {row.map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.key}
                onPress={() => handlePress(num.toString())}
                activeOpacity={0.7}
              >
                <Text style={styles.keyText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={styles.keyRow}>
          {/* Empty Space / Backspace / 0 / Submit */}
          <TouchableOpacity
            style={styles.key}
            onPress={handleBackspace}
            activeOpacity={0.7}
          >
            <MaterialIcons name="backspace" size={24} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.key}
            onPress={() => handlePress("0")}
            activeOpacity={0.7}
          >
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.key, styles.submitKey]}
            onPress={handleSubmit}
            activeOpacity={0.7}
          >
            <MaterialIcons name="check" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Forced White Theme
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  bankInfo: {
    // Empty as requested
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: 0.5,
  },
  payeeInfo: {
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginBottom: 40,
    gap: 8,
  },
  payeeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  payeeLabel: {
    fontSize: 14,
    color: "#757575",
  },
  payeeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  amountText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 20,
  },
  dotLine: {
    width: 40,
    height: 40,
    borderBottomWidth: 2,
    borderBottomColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  dotFilled: {
    borderBottomColor: "#000000",
  },
  dotCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#000000",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#000000",
    fontWeight: "600",
  },
  secureFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    backgroundColor: "#FAFAFA",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  secureText: {
    fontSize: 12,
    color: "#757575",
  },
  keypad: {
    backgroundColor: "#FFFFFF",
  },
  keyRow: {
    flexDirection: "row",
    height: 70,
  },
  key: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "#F0F0F0",
  },
  keyText: {
    fontSize: 28,
    color: "#000000",
    fontWeight: "400",
  },
  submitKey: {
    backgroundColor: "#2962FF", // Classic Blue submit
  },
});
