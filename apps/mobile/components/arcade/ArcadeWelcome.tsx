import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { PallyIcon } from "../ui/PallyIcon";

interface ArcadeWelcomeProps {
  message?: string;
}

export function ArcadeWelcome({ message }: ArcadeWelcomeProps) {
  return (
    <View style={styles.container}>
      {/* Background glow */}
      <View style={styles.backgroundGlow} />

      {/* Icon */}
      <View style={styles.iconContainer}>
        <PallyIcon size={28} />
        <View style={styles.gameBadge}>
          <Text style={styles.gameEmoji}>🎮</Text>
        </View>
      </View>

      {/* Text */}
      <View style={styles.textContainer}>
        <Text style={styles.text}>
          <Text style={styles.highlight}>Welcome to the Arcade!</Text>
          {"\n"}
          {message || "Beat bad habits, earn coins, level up 🎮"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A22",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    overflow: "hidden",
  },
  backgroundGlow: {
    position: "absolute",
    top: -24,
    right: -24,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255, 140, 50, 0.1)",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#0F0F14",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  squirrel: {
    fontSize: 28,
  },
  gameBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF8C32",
    borderRadius: 999,
    padding: 4,
    borderWidth: 2,
    borderColor: "#1A1A22",
    transform: [{ rotate: "12deg" }],
  },
  gameEmoji: {
    fontSize: 12,
  },
  textContainer: {
    flex: 1,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  highlight: {
    color: "#FF8C32",
    fontWeight: "700",
  },
});
