import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useEffect } from "react";
import Svg, { Path, Circle, G } from "react-native-svg";

interface SavingsWheelProps {
  onSpin: () => void;
  isSpinning?: boolean;
}

export function SavingsWheel({ onSpin, isSpinning }: SavingsWheelProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slow continuous rotation animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      {/* Top gradient line */}
      <View style={styles.topLine} />

      {/* Wheel */}
      <View style={styles.wheelContainer}>
        <Animated.View
          style={[styles.wheel, { transform: [{ rotate: rotation }] }]}
        >
          <Svg width={112} height={112} viewBox="0 0 112 112">
            {/* Wheel segments */}
            <G transform="translate(56, 56)">
              <Path d="M0,-56 A56,56 0 0,1 48.5,-28 L0,0 Z" fill="#FF8C32" />
              <Path d="M48.5,-28 A56,56 0 0,1 48.5,28 L0,0 Z" fill="#FFD166" />
              <Path d="M48.5,28 A56,56 0 0,1 0,56 L0,0 Z" fill="#3DDC97" />
              <Path d="M0,56 A56,56 0 0,1 -48.5,28 L0,0 Z" fill="#5D5FEF" />
              <Path d="M-48.5,28 A56,56 0 0,1 -48.5,-28 L0,0 Z" fill="#EF5DA8" />
              <Path d="M-48.5,-28 A56,56 0 0,1 0,-56 L0,0 Z" fill="#FF8C32" />
            </G>
          </Svg>
        </Animated.View>

        {/* Center button */}
        <View style={styles.centerButton}>
          <View style={styles.centerDot} />
        </View>

        {/* Pointer */}
        <View style={styles.pointer} />
      </View>

      {/* Text */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>Savings Wheel</Text>
        <Text style={styles.subtitle}>Spin daily for bonus coins!</Text>
      </View>

      {/* Spin button */}
      <TouchableOpacity
        style={styles.spinButton}
        onPress={onSpin}
        activeOpacity={0.8}
      >
        <MaterialIcons name="casino" size={18} color="#FFFFFF" />
        <Text style={styles.spinButtonText}>Spin Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A22",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    gap: 16,
    overflow: "hidden",
  },
  topLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 140, 50, 0.3)",
  },
  wheelContainer: {
    width: 112,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  wheel: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    borderColor: "#2A2A35",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  centerButton: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF8C32",
  },
  pointer: {
    position: "absolute",
    top: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 16,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  textContainer: {
    alignItems: "center",
    gap: 4,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    color: "#B0B0C3",
    fontSize: 12,
  },
  spinButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FF8C32",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 5,
  },
  spinButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
