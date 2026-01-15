import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { storage, useAuth } from "@repo/auth";

// Storage key for onboarding completion
const ONBOARDING_COMPLETE_KEY = "onboarding_complete";

const STEPS = [
  {
    number: "1️⃣",
    text: "Add allowance",
    iconPrimary: "account-balance-wallet",
    iconSecondary: "monetization-on",
  },
  {
    number: "2️⃣",
    text: "Spend mindfully",
    iconPrimary: "fastfood",
    iconSecondary: "local-taxi",
  },
  {
    number: "3️⃣",
    text: "Save & win",
    iconPrimary: "local-fire-department",
    iconSecondary: "emoji-events",
  },
];

export default function HowItWorksScreen() {
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

  const handleContinue = () => {
    // Navigate to next onboarding screen
    router.push("/(auth)/wallet-explanation");
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
        <Text style={styles.title}>How PocketPal works</Text>

        {/* Steps list */}
        <View style={styles.stepsContainer}>
          <View style={styles.stepsList}>
            {STEPS.map((step, index) => (
              <View key={index} style={styles.stepCard}>
                <View style={styles.stepIconContainer}>
                  <MaterialIcons
                    name={step.iconPrimary as any}
                    size={20}
                    color="#FF8C32"
                    style={styles.iconPrimary}
                  />
                  <MaterialIcons
                    name={step.iconSecondary as any}
                    size={16}
                    color={index === 2 ? "#FFD166" : "#B0B0C3"}
                    style={styles.iconSecondary}
                  />
                </View>
                <Text style={styles.stepText}>
                  {step.number} {step.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Tip text */}
          <Text style={styles.tipText}>
            You're always in control. No hidden locks.
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
            That's it. Three simple steps 🐿️
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
          <Text style={styles.buttonText}>Let's set it up</Text>
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
    letterSpacing: -0.5,
    marginBottom: 32,
  },
  stepsContainer: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 32,
  },
  stepsList: {
    gap: 16,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A22",
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 140, 50, 0.1)",
    position: "relative",
    overflow: "hidden",
  },
  iconPrimary: {
    position: "absolute",
    top: 10,
    left: 10,
  },
  iconSecondary: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  stepText: {
    flex: 1,
    fontSize: 17,
    fontWeight: "500",
    color: "#E0E0E0",
    lineHeight: 24,
  },
  tipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#B0B0C3",
    textAlign: "center",
    marginTop: 32,
    paddingHorizontal: 16,
    opacity: 0.8,
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
