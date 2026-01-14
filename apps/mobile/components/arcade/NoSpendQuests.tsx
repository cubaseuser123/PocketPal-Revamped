import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface Quest {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  isStarted?: boolean;
}

interface NoSpendQuestsProps {
  quests: Quest[];
  onStartQuest: (id: string) => void;
}

export function NoSpendQuests({ quests, onStartQuest }: NoSpendQuestsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>No-Spend Quests 🛡️</Text>

      <View style={styles.questList}>
        {quests.map((quest) => (
          <View key={quest.id} style={styles.questCard}>
            <View style={styles.questContent}>
              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${quest.iconColor}15`, borderColor: `${quest.iconColor}20` },
                ]}
              >
                <MaterialIcons name={quest.icon} size={20} color={quest.iconColor} />
              </View>

              {/* Text */}
              <View style={styles.textContainer}>
                <Text style={styles.questName}>{quest.name}</Text>
                <Text style={styles.questDescription}>{quest.description}</Text>
              </View>
            </View>

            {/* Button */}
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => onStartQuest(quest.id)}
            >
              <Text style={styles.startButtonText}>
                {quest.isStarted ? "IN PROGRESS" : "START QUEST"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  questList: {
    gap: 12,
  },
  questCard: {
    backgroundColor: "#1A1A22",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  questContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  questName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  questDescription: {
    color: "#B0B0C3",
    fontSize: 11,
  },
  startButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
