import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface LevelProgressCardProps {
  level: number;
  currentXp: number;
  maxXp: number;
  pallyMessage?: string;
}

export function LevelProgressCard({
  level,
  currentXp,
  maxXp,
  pallyMessage = "Level up by saving and playing 🎮",
}: LevelProgressCardProps) {
  const progressPercent = (currentXp / maxXp) * 100;

  return (
    <View style={styles.container}>
      {/* Pally message */}
      <View style={styles.messageRow}>
        <Text style={styles.pallyEmoji}>🐿️</Text>
        <View style={styles.messageBubble}>
          <Text style={styles.messageText}>{pallyMessage}</Text>
        </View>
      </View>

      {/* Level info */}
      <View style={styles.levelRow}>
        <Text style={styles.levelText}>Level {level}</Text>
        <Text style={styles.xpText}>{currentXp}/{maxXp} XP</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFillWrapper, { width: `${progressPercent}%` }]}>
          <LinearGradient
            colors={["#FF8C32", "#FFD166"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressFill}
          >
            <View style={styles.progressShine} />
          </LinearGradient>
        </View>
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
    borderColor: "rgba(255, 255, 255, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  pallyEmoji: {
    fontSize: 24,
    paddingTop: 4,
  },
  messageBubble: {
    backgroundColor: "#2A2A35",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    flex: 1,
  },
  messageText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    fontWeight: "500",
  },
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  levelText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  xpText: {
    color: "#FF8C32",
    fontSize: 14,
    fontWeight: "700",
  },
  progressBg: {
    height: 12,
    backgroundColor: "#2A2A35",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFillWrapper: {
    height: "100%",
  },
  progressFill: {
    flex: 1,
    borderRadius: 6,
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 3,
  },
  progressShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
});
