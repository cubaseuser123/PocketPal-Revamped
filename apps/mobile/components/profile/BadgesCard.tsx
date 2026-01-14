import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface Badge {
  id: string;
  name: string;
  emoji: string;
  color: string;
  unlocked: boolean;
}

interface BadgesCardProps {
  badges: Badge[];
  onViewAll?: () => void;
}

export function BadgesCard({ badges, onViewAll }: BadgesCardProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Badges & Achievements</Text>
        <TouchableOpacity onPress={onViewAll}>
          <MaterialIcons name="chevron-right" size={24} color="#B0B0C3" />
        </TouchableOpacity>
      </View>

      {/* Badges grid */}
      <View style={styles.grid}>
        {badges.map((badge) => (
          <TouchableOpacity
            key={badge.id}
            style={[styles.badgeItem, !badge.unlocked && styles.badgeLocked]}
          >
            <View
              style={[
                styles.badgeIcon,
                {
                  backgroundColor: badge.unlocked
                    ? `${badge.color}15`
                    : "#2A2A35",
                  borderColor: badge.unlocked
                    ? `${badge.color}30`
                    : "rgba(255, 255, 255, 0.05)",
                },
              ]}
            >
              <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
            </View>
            <Text style={styles.badgeName}>{badge.name}</Text>
          </TouchableOpacity>
        ))}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  badgeItem: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  badgeLocked: {
    opacity: 0.5,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  badgeEmoji: {
    fontSize: 20,
  },
  badgeName: {
    color: "#B0B0C3",
    fontSize: 9,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 12,
  },
});
