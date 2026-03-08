import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF8C32" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F0F14",
    gap: 16,
  },
  text: {
    color: "#B0B0C3",
    fontSize: 14,
    fontWeight: "500",
  },
});
