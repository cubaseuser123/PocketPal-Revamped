import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

interface PredictionCardProps {
  category: string;
  prediction: string;
}

export function PredictionCard({ category, prediction }: PredictionCardProps) {
  return (
    <View className="relative rounded-2xl overflow-hidden">
      {/* Gradient border */}
      <LinearGradient
        colors={["rgba(139,92,246,0.3)", "rgba(255,140,50,0.2)", "rgba(139,92,246,0.1)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="absolute inset-0 p-[1px] rounded-2xl"
      />
      
      {/* Content */}
      <View className="bg-[#15151C] rounded-2xl p-4 flex-row gap-4 items-center m-[1px]">
        {/* Icon */}
        <View className="h-10 w-10 rounded-full bg-indigo-500/10 items-center justify-center">
          <MaterialIcons name="query-stats" size={24} color="#818CF8" />
        </View>

        {/* Text */}
        <View className="flex-1 gap-1">
          <Text className="text-white text-sm font-bold">Prediction</Text>
          <Text className="text-text-secondary text-xs leading-relaxed">
            Spending on{" "}
            <Text className="text-indigo-300 font-semibold">'{category}'</Text>{" "}
            {prediction}
          </Text>
        </View>
      </View>
    </View>
  );
}
