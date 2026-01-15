import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function WalletExplanationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bounceAnim = useRef(new Animated.Value(0)).current;

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

  const handleContinue = () => {
    // Navigate to next onboarding screen (KYC)
    router.push("/(auth)/kyc-explanation");
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
        <Text style={styles.title}>Two wallets.{"\n"}One goal.</Text>

        {/* Wallets Container */}
        <View style={styles.cardsContainer}>
          {/* Expense Wallet Card */}
          <View style={styles.card}>
            <View style={[styles.glow, { backgroundColor: "rgba(255, 140, 50, 0.05)" }]} />
            <View style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: "rgba(255, 140, 50, 0.1)" }]}>
                <MaterialIcons name="credit-card" size={24} color="#FF8C32" />
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Expense Wallet</Text>
                  <View style={styles.pill}>
                    <MaterialIcons name="fastfood" size={16} color="#B0B0C3" />
                    <MaterialIcons name="local-taxi" size={16} color="#B0B0C3" />
                  </View>
                </View>
                <Text style={styles.cardDescription}>
                  This is where you spend from. Think of it as your weekly allowance wallet.
                </Text>
              </View>
            </View>
          </View>

          {/* Savings Wallet Card */}
          <View style={styles.card}>
            <View style={[styles.glow, { backgroundColor: "rgba(255, 209, 102, 0.05)" }]} />
            <View style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: "rgba(255, 209, 102, 0.1)" }]}>
                <MaterialIcons name="lock" size={24} color="#FFD166" />
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Savings Wallet</Text>
                  <View style={styles.pill}>
                    <MaterialIcons name="local-fire-department" size={16} color="#FFD166" />
                    <MaterialIcons name="monetization-on" size={16} color="#FFD166" />
                  </View>
                </View>
                <Text style={styles.cardDescription}>
                  Money you move here counts as real savings. This is what powers your streaks & rewards.
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom text */}
          <Text style={styles.bottomText}>
            PocketPal cannot move money without your approval.
          </Text>
        </View>
      </View>

      {/* Pally with speech bubble - positioned above button */}
      <Animated.View
        style={[
          styles.pallyContainer,
          { transform: [{ translateY: bounceAnim }] },
        ]}
      >
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>
            You're always in control 🐿️
          </Text>
          <View style={styles.speechTail} />
        </View>
        <Text style={styles.pallyEmoji}>🐿️</Text>
      </Animated.View>

      {/* Bottom button */}
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 38,
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 32,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    backgroundColor: "#1A1A22",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 128,
    height: 128,
    borderRadius: 64,
    transform: [{ translateX: 64 }, { translateY: -64 }],
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  cardDescription: {
    fontSize: 14,
    color: "#B0B0C3",
    lineHeight: 22,
  },
  bottomText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#B0B0C3",
    textAlign: "center",
    marginTop: 24,
    opacity: 0.7,
    paddingHorizontal: 24,
  },
  pallyContainer: {
    alignItems: "flex-end",
    paddingRight: 8,
    marginTop: -20,
  },
  speechBubble: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomRightRadius: 0,
    marginBottom: 8,
    marginRight: 16,
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
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderTopColor: "#FFFFFF",
  },
  pallyEmoji: {
    fontSize: 72,
    transform: [{ scaleX: -1 }],
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 10 },
    textShadowRadius: 20,
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
