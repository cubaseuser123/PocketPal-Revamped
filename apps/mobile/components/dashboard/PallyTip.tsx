import { View, Text, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface PallyTipProps {
  message: string;
}

export function PallyTip({ message }: PallyTipProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#2A2A35", "#1A1A22"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Squirrel icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🐿️</Text>
          </View>

          {/* Tip content */}
          <View style={styles.textContainer}>
            <Text style={styles.tipLabel}>PALLY TIP</Text>
            <Text style={styles.message}>{message}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: "hidden",
    // Shadow for iOS
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  gradient: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    height: 40,
    width: 40,
    backgroundColor: "rgba(255, 140, 50, 0.2)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  tipLabel: {
    color: "#FF8C32",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 2,
  },
  message: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
});
