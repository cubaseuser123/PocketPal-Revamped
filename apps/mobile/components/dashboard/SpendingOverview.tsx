import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";

type Period = "week" | "month" | "3m";

interface PeriodData {
  spent: number;
  avgPerDay: number;
  label: string;
  chartPath: string;
  chartFillPath: string;
  xLabels: string[];
}

interface SpendingOverviewProps {
  selectedPeriod: Period;
  onPeriodChange: (period: Period) => void;
  data: Record<Period, PeriodData>;
}

const periods = [
  { key: "week" as const, label: "Week" },
  { key: "month" as const, label: "Month" },
  { key: "3m" as const, label: "3M" },
];

export function SpendingOverview({
  selectedPeriod,
  onPeriodChange,
  data,
}: SpendingOverviewProps) {
  const currentData = data[selectedPeriod];

  return (
    <View className="bg-card-dark rounded-3xl p-5 border border-white/5 relative overflow-hidden">
      {/* Background glow */}
      <View className="absolute -top-20 -right-20 w-44 h-44 bg-primary/5 rounded-full" />

      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 rounded-full bg-primary/10 items-center justify-center">
            <MaterialIcons name="show-chart" size={18} color="#FF8C32" />
          </View>
          <Text className="text-white font-bold text-lg">Spending Overview</Text>
        </View>

        {/* Period toggle */}
        <View className="flex-row bg-card-dark-secondary rounded-lg p-0.5">
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              onPress={() => onPeriodChange(period.key)}
              className={`px-3 py-1 rounded-md ${
                selectedPeriod === period.key ? "bg-card-dark" : ""
              }`}
            >
              <Text
                className={`text-[10px] font-semibold ${
                  selectedPeriod === period.key
                    ? "text-white"
                    : "text-text-secondary"
                }`}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats */}
      <View className="flex-row justify-between items-end px-1 mb-4">
        <View>
          <Text className="text-text-secondary text-xs mb-1">
            {currentData.label}
          </Text>
          <Text className="text-2xl font-bold text-white">
            ₹{currentData.spent.toLocaleString()}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-text-secondary text-xs mb-1">Avg per day</Text>
          <Text className="text-lg font-bold text-white">
            ₹{currentData.avgPerDay.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Chart */}
      <View className="h-32 w-full mb-2">
        {/* Grid lines */}
        <View className="absolute inset-0 justify-between">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              className="w-full h-[1px] bg-white/5 border-t border-dashed border-white/10"
            />
          ))}
        </View>

        {/* SVG Chart */}
        <Svg width="100%" height="100%" viewBox="0 0 100 50" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FF8C32" stopOpacity={0.2} />
              <Stop offset="100%" stopColor="#FF8C32" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          
          {/* Line */}
          <Path
            d={currentData.chartPath}
            fill="none"
            stroke="#FF8C32"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Fill */}
          <Path
            d={currentData.chartFillPath}
            fill="url(#chartGradient)"
          />
          
          {/* End point */}
          <Circle cx={100} cy={10} r={2} fill="#FF8C32" />
        </Svg>
      </View>

      {/* X-axis labels */}
      <View className="flex-row justify-between px-1 mb-4">
        {currentData.xLabels.map((label, idx) => (
          <Text key={idx} className="text-[10px] text-text-secondary">
            {label}
          </Text>
        ))}
      </View>

      {/* Pally hint */}
      <View className="bg-card-dark-secondary/50 rounded-xl p-3 flex-row items-center gap-2 border border-white/5">
        <Text className="text-lg">🐿️</Text>
        <Text className="text-xs text-text-secondary italic">
          Tap a wallet to see its story
        </Text>
      </View>
    </View>
  );
}
