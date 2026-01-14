import { View, Text, StyleSheet } from "react-native";

interface Stat {
  id: string;
  emoji: string;
  value: string;
  label: string;
}

interface StatsOverviewCardProps {
  stats: Stat[];
}

export function StatsOverviewCard({ stats }: StatsOverviewCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stats Overview</Text>

      <View style={styles.grid}>
        {stats.map((stat, index) => (
          <View
            key={stat.id}
            style={[
              styles.statItem,
              index < stats.length - 1 && styles.statBorder,
            ]}
          >
            <Text style={styles.emoji}>{stat.emoji}</Text>
            <Text style={styles.value}>{stat.value}</Text>
            <Text style={styles.label}>{stat.label}</Text>
          </View>
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
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 4,
  },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.1)",
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  value: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  label: {
    color: "#B0B0C3",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
