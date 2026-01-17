import { View, Text, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Status = "on-track" | "at-risk" | "unlikely" | "no-goal";

interface WeeklySavingGoalProps {
  currentAmount: number;
  targetAmount: number;
  status: Status;
  todaySaved?: number;
}

const STATUS_CONFIG = {
  "on-track": {
    label: "On Track",
    bgColor: "rgba(61, 220, 151, 0.1)",
    borderColor: "rgba(61, 220, 151, 0.2)",
    textColor: "#3DDC97",
    dotColor: "#3DDC97",
  },
  "at-risk": {
    label: "At Risk",
    bgColor: "rgba(255, 209, 102, 0.1)",
    borderColor: "rgba(255, 209, 102, 0.2)",
    textColor: "#FFD166",
    dotColor: "#FFD166",
  },
  unlikely: {
    label: "Unlikely",
    bgColor: "rgba(255, 75, 75, 0.1)",
    borderColor: "rgba(255, 75, 75, 0.2)",
    textColor: "#FF4B4B",
    dotColor: "#FF4B4B",
  },
  "no-goal": {
    label: "No Goal Set",
    bgColor: "rgba(176, 176, 195, 0.1)",
    borderColor: "rgba(176, 176, 195, 0.2)",
    textColor: "#B0B0C3",
    dotColor: "#B0B0C3",
  },
};

export function WeeklySavingGoal({
  currentAmount,
  targetAmount,
  status,
  todaySaved,
}: WeeklySavingGoalProps) {
  const progress = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
  const config = STATUS_CONFIG[status];

  return (
    <View style={styles.container}>
      {/* Background glow */}
      <View style={styles.backgroundGlow} />
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>Main Saving Goal</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currentAmount}>
              ₹{currentAmount.toLocaleString()}
            </Text>
            <Text style={styles.targetAmount}>
              / ₹{targetAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Status badge */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: config.bgColor,
              borderColor: config.borderColor,
            },
          ]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: config.dotColor }]}
          />
          <Text style={[styles.statusText, { color: config.textColor }]}>
            {config.label}
          </Text>
        </View>
      </View>
      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]}>
          <LinearGradient
            colors={["#FF8C32", "#FFA24C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressGradient}
          />
          {/* Shine effect */}
          <LinearGradient
            colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.progressShine}
          />
        </View>
      </View>
      {/* Today's save */}
      {todaySaved !== undefined && (
        <Text style={styles.todaySaved}>
          You saved ₹{todaySaved} this week! 🔥
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A22",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    position: "relative",
    overflow: "hidden",
  },
  backgroundGlow: {
    position: "absolute",
    right: -40,
    top: -40,
    width: 128,
    height: 128,
    backgroundColor: "rgba(255, 140, 50, 0.1)",
    borderRadius: 64,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  label: {
    color: "#B0B0C3",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  currentAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  targetAmount: {
    color: "#B0B0C3",
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressBarContainer: {
    height: 12,
    width: "100%",
    backgroundColor: "#2A2A35",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressGradient: {
    flex: 1,
    borderRadius: 6,
  },
  progressShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    borderRadius: 6,
  },
  todaySaved: {
    color: "#B0B0C3",
    fontSize: 12,
    textAlign: "right",
  },
});
