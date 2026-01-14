import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

interface ProfileHeaderProps {
  name: string;
  subtitle: string;
  avatarUrl: string;
  onEditPress?: () => void;
}

export function ProfileHeader({
  name,
  subtitle,
  avatarUrl,
  onEditPress,
}: ProfileHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <LinearGradient
          colors={["#FF8C32", "#FFD166"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarGradient}
        >
          <View style={styles.avatarInner}>
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>
        </LinearGradient>

        {/* Edit button */}
        <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
          <MaterialIcons name="edit" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Name & subtitle */}
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 16,
  },
  avatarContainer: {
    marginBottom: 16,
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarGradient: {
    width: 112,
    height: 112,
    borderRadius: 56,
    padding: 3,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 53,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#0F0F14",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  editButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2A2A35",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  name: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#B0B0C3",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
});
