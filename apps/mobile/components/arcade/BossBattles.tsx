import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";

interface Boss {
  id: string;
  name: string;
  emoji: string;
  type: "BOSS" | "MINION";
  weakness: string;
  hpPercent: number;
}

interface BossBattlesProps {
  bosses: Boss[];
  onSeeMap?: () => void;
  onPressBoss?: (id: string) => void;
}

export function BossBattles({ bosses, onSeeMap, onPressBoss }: BossBattlesProps) {
  const getTypeColor = (type: Boss["type"]) => {
    return type === "BOSS" ? "#EF4444" : "#FFA24C";
  };

  const getHpColor = (hp: number) => {
    if (hp <= 30) return "#EF4444";
    if (hp <= 60) return "#FFA24C";
    return "#3DDC97";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Boss Battles</Text>
        <Text style={styles.seeMap} onPress={onSeeMap}>
          See Map &gt;
        </Text>
      </View>

      {/* Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {bosses.map((boss) => {
          const typeColor = getTypeColor(boss.type);
          const hpColor = getHpColor(boss.hpPercent);

          return (
            <TouchableOpacity
              key={boss.id}
              style={styles.card}
              onPress={() => onPressBoss?.(boss.id)}
              activeOpacity={0.8}
            >
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.emojiContainer}>
                  <Text style={styles.emoji}>{boss.emoji}</Text>
                </View>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: `${typeColor}15`, borderColor: `${typeColor}30` },
                  ]}
                >
                  <Text style={[styles.typeText, { color: typeColor }]}>
                    {boss.type}
                  </Text>
                </View>
              </View>

              {/* Info */}
              <View style={styles.infoContainer}>
                <Text style={styles.bossName}>{boss.name}</Text>
                <Text style={styles.weakness}>Weakness: {boss.weakness}</Text>
              </View>

              {/* HP Bar */}
              <View style={styles.hpContainer}>
                <View style={styles.hpHeader}>
                  <Text style={styles.hpLabel}>HP</Text>
                  <Text style={[styles.hpPercent, { color: hpColor }]}>
                    {boss.hpPercent}%
                  </Text>
                </View>
                <View style={styles.hpBarBg}>
                  <View
                    style={[
                      styles.hpBarFill,
                      {
                        width: `${boss.hpPercent}%`,
                        backgroundColor: hpColor,
                      },
                    ]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 4,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  seeMap: {
    color: "#FF8C32",
    fontSize: 12,
    fontWeight: "600",
  },
  scrollContent: {
    paddingRight: 20,
    gap: 16,
  },
  card: {
    width: 220,
    backgroundColor: "#1A1A22",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#2A2A35",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  emoji: {
    fontSize: 28,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  infoContainer: {
    gap: 2,
  },
  bossName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  weakness: {
    color: "#B0B0C3",
    fontSize: 12,
  },
  hpContainer: {
    gap: 6,
  },
  hpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hpLabel: {
    color: "#B0B0C3",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  hpPercent: {
    fontSize: 10,
    fontWeight: "700",
  },
  hpBarBg: {
    height: 10,
    backgroundColor: "#0F0F14",
    borderRadius: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  hpBarFill: {
    height: "100%",
    borderRadius: 5,
  },
});
