import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { storage, userApi } from "@repo/auth";
import { PallyIcon } from "../../components/ui/PallyIcon";

const ONBOARDING_COMPLETE_KEY = "onboarding_complete";

export default function OnboardingSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const jumpAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Mark onboarding complete in backend and local storage
    const completeOnboarding = async () => {
      try {
        const baseUrl = Platform.OS === "android" ? "http://10.0.2.2:5757" : "http://localhost:5757";
        await userApi.completeOnboarding(baseUrl);
        console.log("✅ Onboarding marked complete in backend");
      } catch (error) {
        console.error("Error marking onboarding complete:", error);
      }
      
      // Always set local storage
      await storage.set(ONBOARDING_COMPLETE_KEY, "true");
    };
    
    completeOnboarding();
    
    // Jump animation for Pally
    Animated.loop(
      Animated.sequence([
        Animated.timing(jumpAnim, {
          toValue: -15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(jumpAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Bounce animation for speech bubble
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

  const handleGoHome = () => {
    router.replace("/(protected)/(tabs)");
  };

  const handleSetGoal = () => {
    router.replace("/(protected)/(tabs)/goals");
  };

  return (
    <View style={styles.container}>
      {/* Background glows */}
      <LinearGradient
        colors={["rgba(255, 140, 50, 0.1)", "transparent"]}
        style={styles.topGlow}
      />
      <View style={styles.bottomGlow} />
      <View style={styles.centerGlow} />

      {/* Confetti elements */}
      <View style={styles.confettiContainer}>
        <View style={[styles.confetti, styles.confetti1]} />
        <View style={[styles.confetti, styles.confetti2]} />
        <View style={[styles.confetti, styles.confetti3]} />
        <View style={[styles.confetti, styles.confetti4]} />
        <View style={[styles.confetti, styles.confetti5]} />
        <View style={[styles.confetti, styles.confetti6]} />
      </View>

      {/* Main content */}
      <View style={[styles.content, { paddingTop: insets.top + 48 }]}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Nice! Your wallet is live 🎉</Text>
        </View>

        {/* Mascot Section */}
        <View style={styles.mascotSection}>
          <View style={styles.mascotWrapper}>
            {/* Speech Bubble */}
            <Animated.View
              style={[
                styles.speechBubbleContainer,
                { transform: [{ translateY: bounceAnim }] },
              ]}
            >
              <View style={styles.speechBubble}>
                <Text style={styles.speechText}>
                  First step done. The fun part starts now
                </Text>
                <View style={styles.speechTail} />
              </View>
            </Animated.View>

            {/* Pally glow */}
            <View style={styles.pallyGlow} />

            {/* Pally */}
            <Animated.View
              style={[
                styles.pallyEmoji,
                { transform: [{ translateY: jumpAnim }] },
                { zIndex: 10 }
              ]}
            >
              <PallyIcon size={96} />
            </Animated.View>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            You're officially ready to play the money game.
          </Text>
        </View>

        {/* Rewards Card */}
        <View style={styles.rewardsCard}>
          <View style={styles.cardGlow} />

          {/* Pocket Coins */}
          <View style={styles.rewardRow}>
            <View style={[styles.rewardIcon, styles.coinsIcon]}>
              <Text style={styles.rewardEmoji}>🪙</Text>
            </View>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>+20 Pocket Coins</Text>
              <Text style={styles.rewardDescription}>Earned for setting up wallet</Text>
            </View>
            <MaterialIcons name="check-circle" size={24} color="#3DDC97" />
          </View>

          <View style={styles.divider} />

          {/* Streak */}
          <View style={styles.rewardRow}>
            <View style={[styles.rewardIcon, styles.streakIcon]}>
              <Text style={styles.rewardEmoji}>🔥</Text>
            </View>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>Starter Streak — Day 1/3</Text>
              <Text style={styles.rewardDescription}>Keep it up to unlock rewards</Text>
            </View>
            <MaterialIcons name="check-circle" size={24} color="#3DDC97" />
          </View>
        </View>
      </View>

      {/* Bottom Buttons */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 32 }]}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleGoHome}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.2)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonShimmer}
          />
          <Text style={styles.primaryButtonText}>Go to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSetGoal}
          activeOpacity={0.6}
        >
          <Text style={styles.secondaryButtonText}>Set my first saving goal</Text>
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
  centerGlow: {
    position: "absolute",
    top: "30%",
    left: "50%",
    marginLeft: -128,
    width: 256,
    height: 256,
    backgroundColor: "rgba(255, 140, 50, 0.1)",
    borderRadius: 128,
  },
  confettiContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confetti: {
    position: "absolute",
    width: 10,
    height: 10,
    opacity: 0.7,
  },
  confetti1: {
    backgroundColor: "#FF8C32",
    top: "15%",
    left: "10%",
    transform: [{ rotate: "15deg" }],
    borderRadius: 2,
  },
  confetti2: {
    backgroundColor: "#3DDC97",
    top: "25%",
    right: "15%",
    transform: [{ rotate: "-30deg" }],
    borderRadius: 5,
    width: 8,
    height: 8,
  },
  confetti3: {
    backgroundColor: "#FFD166",
    top: "18%",
    left: "25%",
    transform: [{ rotate: "45deg" }],
    width: 6,
    height: 12,
  },
  confetti4: {
    backgroundColor: "#FFA24C",
    top: "12%",
    right: "30%",
    transform: [{ rotate: "-15deg" }],
    borderRadius: 2,
  },
  confetti5: {
    borderWidth: 2,
    borderColor: "#FF8C32",
    backgroundColor: "transparent",
    top: "28%",
    left: "5%",
    transform: [{ rotate: "20deg" }],
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  confetti6: {
    backgroundColor: "#3DDC97",
    top: "10%",
    right: "5%",
    transform: [{ rotate: "60deg" }],
    width: 15,
    height: 6,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  mascotSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  mascotWrapper: {
    alignItems: "center",
    position: "relative",
  },
  speechBubbleContainer: {
    marginBottom: 8,
    transform: [{ translateX: -32 }],
    zIndex: 20,
  },
  speechBubble: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomRightRadius: 0,
    width: 192,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  speechText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F0F14",
    textAlign: "center",
    lineHeight: 20,
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
  pallyGlow: {
    position: "absolute",
    top: 60,
    width: 160,
    height: 160,
    backgroundColor: "rgba(255, 140, 50, 0.2)",
    borderRadius: 80,
  },
  pallyEmoji: {
    fontSize: 96,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 15 },
    textShadowRadius: 25,
    zIndex: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#B0B0C3",
    textAlign: "center",
    marginTop: 24,
    maxWidth: 280,
    lineHeight: 24,
  },
  rewardsCard: {
    backgroundColor: "#1A1A22",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 24,
    position: "relative",
    overflow: "hidden",
  },
  cardGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 80,
    height: 80,
    backgroundColor: "rgba(255, 140, 50, 0.05)",
    borderRadius: 40,
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  coinsIcon: {
    backgroundColor: "rgba(255, 209, 102, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 209, 102, 0.1)",
  },
  streakIcon: {
    backgroundColor: "rgba(255, 140, 50, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 140, 50, 0.1)",
  },
  rewardEmoji: {
    fontSize: 20,
  },
  rewardInfo: {
    flex: 1,
    gap: 2,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  rewardDescription: {
    fontSize: 12,
    fontWeight: "500",
    color: "#B0B0C3",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginVertical: 20,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  primaryButton: {
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
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FF8C32",
  },
});
