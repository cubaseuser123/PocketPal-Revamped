import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  // Season badge for Arcade
  seasonBadge?: string;
  // For Home screen with avatar
  showAvatar?: boolean;
  userName?: string;
  userLevel?: number;
  avatarUrl?: string;
  onAvatarPress?: () => void;
  // Right side content
  coins?: number;
  rightContent?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  seasonBadge,
  showAvatar,
  userName,
  userLevel,
  avatarUrl,
  onAvatarPress,
  coins,
  rightContent,
}: PageHeaderProps) {
  const insets = useSafeAreaInsets();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Left side */}
      <View style={styles.leftContent}>
        {showAvatar ? (
          // Home screen with avatar
          <View style={styles.avatarRow}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={onAvatarPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#FF8C32", "#FFD166"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <View style={styles.avatarInner}>
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarPlaceholderText}>
                        {userName?.charAt(0)?.toUpperCase() || "👤"}
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
              {userLevel !== undefined && (
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>Lv {userLevel}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.greetingContainer}>
              <Text style={styles.title}>
                Hey, {userName} 👋
              </Text>
              <Text style={styles.subtitle}>You're doing great today</Text>
            </View>
          </View>
        ) : (
          // Standard page header
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>{title}</Text>
            {seasonBadge && (
              <View style={styles.seasonBadge}>
                <Text style={styles.seasonText}>{seasonBadge}</Text>
              </View>
            )}
          </View>
        )}
        {!showAvatar && subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>

      {/* Right side */}
      <View style={styles.rightContent}>
        {rightContent || (
          coins !== undefined && (
            <View style={styles.coinsBadge}>
              <MaterialIcons name="monetization-on" size={16} color="#FFD166" />
              <Text style={styles.coinsText}>
                {coins.toLocaleString()}
              </Text>
            </View>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "rgba(15, 15, 20, 0.9)",
  },
  leftContent: {
    flex: 1,
  },
  rightContent: {
    marginBottom: 4,
  },
  // Avatar variant (Home screen)
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarGradient: {
    height: 48,
    width: 48,
    borderRadius: 24,
    padding: 2,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: "#0F0F14",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#0F0F14",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  levelBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#FFD166",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#0F0F14",
  },
  levelText: {
    color: "#0F0F14",
    fontSize: 9,
    fontWeight: "700",
  },
  greetingContainer: {
    gap: 2,
  },
  // Standard variant
  titleContainer: {
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  pageTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#B0B0C3",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  seasonBadge: {
    backgroundColor: "#1A1A22",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 140, 50, 0.5)",
  },
  seasonText: {
    color: "#FF8C32",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Coins badge
  coinsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1A1A22",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  coinsText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1A1A22",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholderText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});

