import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface OtherGoalCardProps {
  title: string;
  currentAmount: string;
  targetAmount: string;
  icon: string;
  color: string; // Tailwind color name like 'blue-500', we'll map or use hex
  progress: number;
  onDelete?: () => void;
  onPress?: () => void;
}

// Simple color mapping for demo
const colorMap: Record<string, string> = {
  "blue-500": "#3B82F6",
  "purple-500": "#A855F7",
  "green-500": "#22C55E",
};

export function OtherGoalCard({
  title,
  currentAmount,
  targetAmount,
  icon,
  color,
  progress,
  onDelete,
  onPress,
}: OtherGoalCardProps) {
  const percent = (progress * 100).toFixed(0);
  const barColor = colorMap[color] || color;

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.details}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.amounts}>
              {currentAmount} / {targetAmount}
            </Text>
          </View>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%`, backgroundColor: barColor },
              ]}
            />
          </View>
        </View>
      </View>
      {onDelete ? (
        <TouchableOpacity 
          onPress={onDelete} 
          style={styles.deleteBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      ) : (
        <MaterialIcons name="chevron-right" size={20} color="#B0B0C3" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A22",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
    paddingRight: 12,
  },
  iconBox: {
    height: 44,
    width: 44,
    borderRadius: 12,
    backgroundColor: "#2A2A35",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 20,
  },
  details: {
    flex: 1,
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  amounts: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B0B0C3",
  },
  progressBg: {
    height: 6,
    backgroundColor: "#0F0F14",
    borderRadius: 3,
    overflow: "hidden",
    width: "100%",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  deleteBtn: {
    padding: 8,
  },
});
