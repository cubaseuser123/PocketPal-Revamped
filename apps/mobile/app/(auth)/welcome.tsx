import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Animations
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current;
  const coinBounce1 = useRef(new Animated.Value(0)).current;
  const coinBounce2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Float animation 1
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Float animation 2
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: -8,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Tilt animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(tiltAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(tiltAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Coin bounce animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(coinBounce1, {
          toValue: -8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(coinBounce1, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(250),
        Animated.timing(coinBounce2, {
          toValue: -8,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(coinBounce2, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const tiltRotation = tiltAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-6deg", "-4deg"],
  });

  const handleGetStarted = () => {
    router.push("/(auth)/login");
  };

  const handleLogin = () => {
    router.push("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      {/* Background glows */}
      <LinearGradient
        colors={["rgba(255, 140, 50, 0.1)", "transparent"]}
        style={styles.topGlow}
      />
      <View style={styles.centerGlow} />

      {/* Main content */}
      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Hero section with app mockup */}
        <View style={styles.heroSection}>
          {/* App mockup card */}
          <Animated.View
            style={[
              styles.mockupCard,
              { transform: [{ rotate: tiltRotation }] },
            ]}
          >
            {/* Mockup header */}
            <View style={styles.mockupHeader}>
              <View style={styles.mockupAvatar} />
              <View style={styles.mockupHeaderBar} />
            </View>

            {/* Mockup content */}
            <View style={styles.mockupContent}>
              {/* Chart card */}
              <View style={styles.mockupChart}>
                <LinearGradient
                  colors={["rgba(255, 140, 50, 0.1)", "transparent"]}
                  style={styles.mockupChartGradient}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                />
                <Svg
                  width="100%"
                  height={48}
                  viewBox="0 0 100 50"
                  preserveAspectRatio="none"
                  style={styles.mockupChartSvg}
                >
                  <Path
                    d="M0 50 L0 30 Q 25 10 50 30 T 100 20 L 100 50 Z"
                    fill="rgba(255, 140, 50, 0.4)"
                  />
                </Svg>
              </View>

              {/* Small cards */}
              <View style={styles.mockupSmallCards}>
                <View style={styles.mockupSmallCard} />
                <View style={styles.mockupSmallCard} />
              </View>
            </View>

            {/* Bottom fade */}
            <LinearGradient
              colors={["transparent", "rgba(15, 15, 20, 0.9)"]}
              style={styles.mockupFade}
            />
          </Animated.View>

          {/* Coins at bottom */}
          <View style={styles.coinsContainer}>
            <Animated.Text
              style={[
                styles.coinSide,
                { transform: [{ translateY: coinBounce1 }] },
              ]}
            >
              🪙
            </Animated.Text>
            <Text style={styles.coinCenter}>🪙</Text>
            <Animated.Text
              style={[
                styles.coinSide,
                { transform: [{ translateY: coinBounce2 }] },
              ]}
            >
              🪙
            </Animated.Text>
            <View style={styles.coinGlow} />
          </View>

          {/* Floating icons */}
          <Animated.View
            style={[
              styles.floatingIcon,
              styles.floatingIconTopRight,
              { transform: [{ translateY: floatAnim2 }, { rotate: "6deg" }] },
            ]}
          >
            <Text style={styles.floatingIconEmoji}>🔥</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.floatingIcon,
              styles.floatingIconBottomLeft,
              { transform: [{ translateY: floatAnim1 }, { rotate: "-6deg" }] },
            ]}
          >
            <Text style={styles.floatingIconEmoji}>🕹️</Text>
          </Animated.View>

          {/* Sparkles */}
          <Text style={[styles.sparkle, styles.sparkle1]}>✨</Text>
          <Text style={[styles.sparkle, styles.sparkle2]}>✨</Text>
        </View>

        {/* Text content */}
        <View style={styles.textContent}>
          <Text style={styles.headline}>
            Turn saving money{"\n"}into a game 🎮
          </Text>
          <Text style={styles.subtitle}>
            PocketPal helps students control their allowance, build saving
            streaks, and earn real rewards — without boring budgeting.
          </Text>
        </View>
      </View>

      {/* Bottom buttons */}
      <LinearGradient
        colors={["transparent", "#0F0F14", "#0F0F14"]}
        style={[styles.bottomSection, { paddingBottom: insets.bottom + 48 }]}
      >
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.2)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonShimmer}
          />
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleLogin}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>
            Already have an account? Log in
          </Text>
        </TouchableOpacity>
      </LinearGradient>
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
    height: "50%",
  },
  centerGlow: {
    position: "absolute",
    top: "20%",
    left: "50%",
    marginLeft: -128,
    width: 256,
    height: 256,
    backgroundColor: "rgba(255, 140, 50, 0.1)",
    borderRadius: 128,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  heroSection: {
    width: "100%",
    aspectRatio: 1,
    maxHeight: 400,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  mockupCard: {
    width: 224,
    height: 288,
    backgroundColor: "#1A1A22",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  mockupHeader: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: "#1A1A22",
  },
  mockupAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  mockupHeaderBar: {
    width: 64,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  mockupContent: {
    padding: 16,
    gap: 12,
    backgroundColor: "#1A1A22",
  },
  mockupChart: {
    height: 96,
    borderRadius: 16,
    backgroundColor: "#2A2A35",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  mockupChartGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
    opacity: 0.6,
  },
  mockupChartSvg: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  mockupSmallCards: {
    flexDirection: "row",
    gap: 12,
  },
  mockupSmallCard: {
    flex: 1,
    height: 80,
    borderRadius: 16,
    backgroundColor: "rgba(42, 42, 53, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  mockupFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  coinsContainer: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  coinSide: {
    fontSize: 36,
  },
  coinCenter: {
    fontSize: 48,
    marginHorizontal: -8,
    zIndex: 10,
    textShadowColor: "rgba(255, 140, 50, 0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  coinGlow: {
    position: "absolute",
    bottom: 8,
    width: 128,
    height: 48,
    backgroundColor: "#FF8C32",
    borderRadius: 24,
    opacity: 0.4,
    zIndex: -1,
  },
  floatingIcon: {
    position: "absolute",
    backgroundColor: "rgba(26, 26, 34, 0.8)",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  floatingIconTopRight: {
    top: "10%",
    right: "0%",
  },
  floatingIconBottomLeft: {
    bottom: "20%",
    left: "-5%",
  },
  floatingIconEmoji: {
    fontSize: 28,
  },
  sparkle: {
    position: "absolute",
    fontSize: 20,
  },
  sparkle1: {
    top: "30%",
    left: "5%",
    color: "#FFD166",
  },
  sparkle2: {
    bottom: "40%",
    right: "5%",
    color: "#FF8C32",
  },
  textContent: {
    alignItems: "center",
    maxWidth: 300,
  },
  headline: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#B0B0C3",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
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
    marginTop: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF8C32",
  },
});
