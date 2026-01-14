import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface MenuItem {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  badge?: string;
  badgeColor?: string;
}

interface SettingsMenuCardProps {
  items: MenuItem[];
  onItemPress: (id: string) => void;
}

export function SettingsMenuCard({ items, onItemPress }: SettingsMenuCardProps) {
  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.menuItem,
            index < items.length - 1 && styles.menuItemBorder,
          ]}
          onPress={() => onItemPress(item.id)}
        >
          <View style={styles.leftContent}>
            <View style={styles.iconContainer}>
              <MaterialIcons name={item.icon} size={20} color="#B0B0C3" />
            </View>
            <Text style={styles.label}>{item.label}</Text>
          </View>

          <View style={styles.rightContent}>
            {item.badge && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: `${item.badgeColor || "#3DDC97"}15` },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: item.badgeColor || "#3DDC97" },
                  ]}
                >
                  {item.badge}
                </Text>
              </View>
            )}
            <MaterialIcons name="chevron-right" size={18} color="#B0B0C3" />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A22",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2A2A35",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
