import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { storage, useAuth } from "@repo/auth";

// Storage key for onboarding completion
const ONBOARDING_COMPLETE_KEY = "onboarding_complete";

export default function KYCExplanationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const authContext = useAuth();

  useEffect(() => {
    // Subtle bounce animation for Pally
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -5,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleCompleteKYC = () => {
    // Navigate to KYC steps overview
    router.push("/(auth)/kyc-steps");
  };

  const handleDoLater = () => {
    // Navigate to add money screen with limited access (no KYC)
    router.push("/(auth)/add-money-limited");
  };

  const finishOnboarding = async () => {
    try {
      // Mark onboarding as complete
      await storage.set(ONBOARDING_COMPLETE_KEY, "true");
      
      // Navigate to main app after onboarding
      router.replace("/(protected)/(tabs)");
    } catch (error) {
      console.error("Error saving onboarding state:", error);
      router.replace("/(protected)/(tabs)");
    }
  };

  return (
    <View style={styles.container}>
      {/* Background glows */}
      <LinearGradient
        colors={["rgba(255, 140, 50, 0.05)", "transparent"]}
        style={styles.topGlow}
      />
      <View style={styles.bottomGlow} />

      {/* Main content */}
      <View style={[styles.content, { paddingTop: insets.top + 32 }]}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Unlock rewards &{"\n"}withdrawals 🔓</Text>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardIntro}>To let you:</Text>
          <View style={styles.list}>
            {[
              "pay merchants",
              "earn rewards",
              "withdraw savings anytime"
            ].map((item, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.listItemText}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={styles.divider} />
          <Text style={styles.cardOutro}>
            we need a one-time identity check.
          </Text>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <MaterialIcons name="lock" size={16} color="#3DDC97" />
          <Text style={styles.securityText}>
            Your details are encrypted and never shared.
          </Text>
        </View>
      </View>

      {/* Pally with ID card - positioned at bottom */}
      <View style={styles.mascotSection}>
        <Animated.View
          style={[
            styles.speechBubbleContainer,
            { transform: [{ translateY: bounceAnim }] },
          ]}
        >
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>
              Quick check. Big unlock 🐿️
            </Text>
            <View style={styles.speechTail} />
          </View>
        </Animated.View>
        
        <View style={styles.mascotContainer}>
          <Text style={styles.pallyEmoji}>🐿️</Text>
          <View style={styles.idCardContainer}>
            <View style={styles.idCard}>
              <View style={styles.idAvatar} />
              <View style={styles.idLineLong} />
              <View style={styles.idLineShort} />
              <View style={styles.idBadge} />
            </View>
          </View>
        </View>
      </View>

      {/* Bottom buttons */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 32 }]}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleCompleteKYC}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.2)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonShimmer}
          />
          <Text style={styles.buttonText}>Complete KYC (2 minutes)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleDoLater}
          activeOpacity={0.6}
        >
          <Text style={styles.secondaryButtonText}>Do this later</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 38,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: "#1A1A22",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  cardIntro: {
    fontSize: 17,
    fontWeight: "500",
    color: "#B0B0C3",
    marginBottom: 16,
  },
  list: {
    gap: 12,
    marginBottom: 20,
    paddingLeft: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF8C32",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  listItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginBottom: 16,
  },
  cardOutro: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 24,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    opacity: 0.8,
  },
  securityText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#B0B0C3",
  },
  mascotSection: {
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 20,
    flex: 1,
  },
  speechBubbleContainer: {
    alignItems: "flex-start", // Change alignment for left side bubble
    marginBottom: 8,
    marginRight: 40, // Offset slightly to look correct with mascot
  },
  speechBubble: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 0, // Tail on left side
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  speechText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F0F14",
  },
  speechTail: {
    position: "absolute",
    bottom: -8,
    left: 0, // Tail on left side
    width: 0,
    height: 0,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
  },
  mascotContainer: {
    position: "relative",
    alignItems: "center",
  },
  pallyEmoji: {
    fontSize: 64,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 10 },
    textShadowRadius: 20,
  },
  idCardContainer: {
    position: "absolute",
    bottom: 0,
    right: -8,
    transform: [{ rotate: "-12deg" }, { translateY: 8 }],
  },
  idCard: {
    width: 40,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FF8C32",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  idAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E0E0E0",
    marginBottom: 4,
  },
  idLineLong: {
    width: 24,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    marginBottom: 2,
  },
  idLineShort: {
    width: 16,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  idBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3DDC97",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
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
    marginBottom: 16,
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
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#B0B0C3",
  },
});
