import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function GoalPallyTip() {
  return (
    <LinearGradient
      colors={["#1A1A22", "#2A2A35"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.skewedBg} />
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🐿️</Text>
      </View>
      <Text style={styles.text}>
        <Text style={styles.highlight}>Pally tip:</Text> Goals give your savings a purpose 🎯
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    position: "relative",
    overflow: "hidden",
  },
  skewedBg: {
    position: "absolute",
    right: -16,
    top: 0,
    height: "100%",
    width: 96,
    backgroundColor: "rgba(255, 140, 50, 0.05)",
    transform: [{ skewX: "-12deg" }],
  },
  iconContainer: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: "#0F0F14",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  icon: {
    fontSize: 20,
  },
  text: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    zIndex: 10,
    flex: 1,
    paddingRight: 8,
  },
  highlight: {
    color: "#FF8C32",
    fontWeight: "700",
  },
});
