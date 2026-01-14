import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface StreakArenaProps {
  currentStreak: number;
  nextRewardDays: number;
  totalDays: number;
  onPress?: () => void;
}

export function StreakArena({
  currentStreak,
  nextRewardDays,
  totalDays = 7,
  onPress,
}: StreakArenaProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Background gradient overlay */}
      <View style={styles.gradientOverlay} />

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <View style={styles.labelRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.label}>STREAK ARENA</Text>
          </View>
          <View style={styles.streakRow}>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakText}> DAYS</Text>
          </View>
          <Text style={styles.nextReward}>
            Next reward in {nextRewardDays} days
          </Text>
        </View>

        {/* Fire icon */}
        <View style={styles.fireContainer}>
          <View style={styles.fireGlow} />
          <MaterialIcons
            name="local-fire-department"
            size={48}
            color="#FF8C32"
            style={styles.fireIcon}
          />
        </View>
      </View>

      {/* Progress dots */}
      <View style={styles.progressContainer}>
        {Array.from({ length: totalDays }).map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.progressDot,
              idx < currentStreak ? styles.progressDotActive : styles.progressDotInactive,
            ]}
          />
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A22",
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 140, 50, 0.2)",
    overflow: "hidden",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 140, 50, 0.03)",
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  leftContent: {
    gap: 4,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3DDC97",
  },
  label: {
    color: "#B0B0C3",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
  },
  streakNumber: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: -1,
  },
  streakText: {
    fontSize: 24,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#FF8C32",
  },
  nextReward: {
    color: "#B0B0C3",
    fontSize: 10,
    fontWeight: "500",
  },
  fireContainer: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  fireGlow: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 140, 50, 0.2)",
  },
  fireIcon: {
    textShadowColor: "rgba(255, 140, 50, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  progressContainer: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressDot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressDotActive: {
    backgroundColor: "#FF8C32",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 3,
  },
  progressDotInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});
