import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageHeader } from "../../components/ui/PageHeader";

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background-dark">
      <PageHeader
        title="Goals"
        subtitle="Track your savings goals"
        coins={1250}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120 + insets.bottom,
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text className="text-6xl mb-4">🎯</Text>
        <Text className="text-white text-xl font-bold text-center">
          Coming Soon
        </Text>
        <Text className="text-text-secondary text-sm text-center mt-2">
          Set goals, track progress, celebrate wins!
        </Text>
      </ScrollView>
    </View>
  );
}
