import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { PallyIcon } from "../../components/ui/PallyIcon";
import Svg, { Path, G } from "react-native-svg";
import { useWheel, useUser } from "../../hooks/useApi";
import { useCustomAlert } from "../../contexts/CustomAlertContext";

// Wheel segments configuration
const WHEEL_SEGMENTS = [
  { label: "+10\nCoins", icon: "monetization-on", color: "#FF8C32", textColor: "#4A2000" },
  { label: "+50\nCoins", icon: "payments", color: "#FFD166", textColor: "#5A4000" },
  { label: "+1 Streak\nShield", icon: "shield", color: "#FFA24C", textColor: "#4A2000" },
  { label: "Better\nLuck", icon: "sentiment-satisfied", color: "#FF8C32", textColor: "#4A2000" },
  { label: "+20\nCoins", icon: "attach-money", color: "#FFD166", textColor: "#5A4000" },
  { label: "Mystery\nBox", icon: "inventory-2", color: "#FFA24C", textColor: "#4A2000" },
];

export default function SavingsWheelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [isSpinning, setIsSpinning] = useState(false);
  const { showAlert } = useCustomAlert();
  
  const { wheelStatus, spin, refetch } = useWheel();
  const { user } = useUser();

  useEffect(() => {
    // Floating animation for Pally
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slow wheel rotation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleSpin = async () => {
    if (!wheelStatus?.canSpin || isSpinning) {
      showAlert("Daily Limit", "You've already spun the wheel today! Come back tomorrow.");
      return;
    }
    
    setIsSpinning(true);
    try {
      const result = await spin();
      showAlert(
        "🎉 Congratulations!",
        result.message || `You won ${result.coinsWon} coins!`,
        [{ text: "Awesome!", onPress: () => refetch() }]
      );
    } catch (error: any) {
      showAlert("Error", error.message || "Failed to spin");
    } finally {
      setIsSpinning(false);
    }
  };

  const wheelRotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <MaterialIcons name="arrow-back" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Savings Wheel</Text>
        </View>
        <View style={styles.coinBadge}>
          <Text style={styles.coinEmoji}>🪙</Text>
          <Text style={styles.coinText}>{user?.coins?.toLocaleString() || 0}</Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Pally with tooltip */}
        <View style={styles.pallySection}>
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>
              Spin the wheel by saving money — luck loves discipline!
            </Text>
          </View>
          <Animated.View style={[styles.pallyContainer, { transform: [{ translateY: floatAnim }] }]}>
            <View style={styles.pallyStick} />
            <View style={styles.pallyDot} />
            <View style={styles.pallyDot} />
            <PallyIcon size={56} style={{ transform: [{ rotate: "-12deg" }] }} />
          </Animated.View>
        </View>

        {/* Wheel */}
        <View style={styles.wheelWrapper}>
          {/* Pointer */}
          <View style={styles.pointerContainer}>
            <View style={styles.pointerTriangle} />
          </View>

          {/* Main Wheel */}
          <Animated.View style={[styles.wheel, { transform: [{ rotate: wheelRotation }] }]}>
            <Svg width={280} height={280} viewBox="0 0 280 280">
              <G transform="translate(140, 140)">
                {/* 6 segments */}
                <Path d="M0,-140 A140,140 0 0,1 121.24,-70 L0,0 Z" fill="#FF8C32" />
                <Path d="M121.24,-70 A140,140 0 0,1 121.24,70 L0,0 Z" fill="#FFD166" />
                <Path d="M121.24,70 A140,140 0 0,1 0,140 L0,0 Z" fill="#FFA24C" />
                <Path d="M0,140 A140,140 0 0,1 -121.24,70 L0,0 Z" fill="#FF8C32" />
                <Path d="M-121.24,70 A140,140 0 0,1 -121.24,-70 L0,0 Z" fill="#FFD166" />
                <Path d="M-121.24,-70 A140,140 0 0,1 0,-140 L0,0 Z" fill="#FFA24C" />
              </G>
            </Svg>

            {/* Segment labels */}
            {WHEEL_SEGMENTS.map((segment, index) => {
              const angle = 60 * index + 30; // Center of each segment
              return (
                <View
                  key={index}
                  style={[
                    styles.segmentLabel,
                    { transform: [{ rotate: `${angle}deg` }] }
                  ]}
                >
                  <View style={styles.segmentLabelInner}>
                    <Text style={[styles.segmentText, { color: segment.textColor }]}>
                      {segment.label}
                    </Text>
                    <MaterialIcons name={segment.icon as any} size={16} color={segment.textColor} />
                  </View>
                </View>
              );
            })}

            {/* Center Hub */}
            <View style={styles.centerHub}>
              <View style={styles.centerHubInner}>
                <Text style={styles.spinLabel}>SPIN</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardGlow} />
          <View style={styles.infoCardContent}>
            <View style={styles.infoCardLeft}>
              <View style={styles.infoIconBox}>
                <MaterialIcons name="restart-alt" size={20} color="#FF8C32" />
              </View>
              <View>
                <Text style={styles.infoTitle}>Daily Spin</Text>
                <Text style={styles.infoSubtitle}>Earn more by saving!</Text>
              </View>
            </View>
            <View style={styles.availBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.availText}>1 Available</Text>
            </View>
          </View>
        </View>

        {/* Spin Button */}
        <TouchableOpacity style={styles.spinButton} onPress={handleSpin} activeOpacity={0.8}>
          <LinearGradient
            colors={["rgba(255,255,255,0.2)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmer}
          />
          <Text style={styles.spinButtonText}>Spin Now</Text>
          <MaterialIcons name="sync" size={24} color="#FFFFFF" />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "rgba(15, 15, 20, 0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A1A22",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1A1A22",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  coinEmoji: {
    fontSize: 14,
  },
  coinText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  pallySection: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  tooltip: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderBottomLeftRadius: 0,
    maxWidth: 200,
    borderWidth: 2,
    borderColor: "rgba(255, 140, 50, 0.2)",
    transform: [{ rotate: "1deg" }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  tooltipText: {
    color: "#0F0F14",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  pallyContainer: {
    alignItems: "center",
  },
  pallyStick: {
    width: 8,
    height: 50,
    backgroundColor: "#3A3A45",
    borderRadius: 4,
    position: "absolute",
    top: -30,
    right: 20,
    transform: [{ rotate: "20deg" }],
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  pallyDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF8C32",
    position: "absolute",
    top: -30,
    right: 16,
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  pallyEmoji: {
    fontSize: 56,
    transform: [{ rotate: "-12deg" }],
  },
  wheelWrapper: {
    width: 300,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  pointerContainer: {
    position: "absolute",
    top: 0,
    zIndex: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  pointerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderTopWidth: 24,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
    zIndex: 40,
  },
  wheel: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 6,
    borderColor: "#25252E",
    backgroundColor: "#1A1A22",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 10,
    overflow: "hidden",
  },
  segmentLabel: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  segmentLabelInner: {
    position: "absolute",
    top: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  segmentText: {
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  centerHub: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF",
    padding: 4,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 6,
    borderColor: "#1A1A22",
  },
  centerHubInner: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "rgba(255, 140, 50, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  spinLabel: {
    color: "#FF8C32",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
  },
  infoCard: {
    width: "100%",
    backgroundColor: "#25252E",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  infoCardGlow: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255, 140, 50, 0.05)",
  },
  infoCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  infoCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A22",
    borderWidth: 1,
    borderColor: "rgba(255, 140, 50, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  infoSubtitle: {
    color: "#B0B0C3",
    fontSize: 10,
    fontWeight: "500",
  },
  availBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 140, 50, 0.15)",
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 140, 50, 0.2)",
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF8C32",
  },
  availText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  spinButton: {
    width: "100%",
    backgroundColor: "#FF8C32",
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 5,
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  spinButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
