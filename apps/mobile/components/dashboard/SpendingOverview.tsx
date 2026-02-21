import { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";
import { PallyIcon } from "../ui/PallyIcon";
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Line,
} from "react-native-svg";

type Period = "week" | "month" | "3m";

interface PeriodData {
  spent: number;
  avgPerDay: number;
  label: string;
  chartPath: string;
  chartFillPath: string;
  xLabels: string[];
  chartPoints?: number[];
  chartEndX?: number;
  chartEndY?: number;
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartLayout, setChartLayout] = useState({ width: 0, height: 0 });

  const resolvedPoints = useMemo(() => {
    const rawPoints =
      currentData.chartPoints && currentData.chartPoints.length > 0
        ? currentData.chartPoints
        : Array.from({ length: currentData.xLabels.length || 2 }, () => 0);

    return rawPoints.map((value) =>
      Number.isFinite(value) ? Math.max(0, Number(value)) : 0
    );
  }, [currentData.chartPoints, currentData.xLabels.length]);

  const chartCoords = useMemo(() => {
    const bottomY = 44;
    const topY = 10;
    const yRange = bottomY - topY;
    const maxValue = Math.max(...resolvedPoints, 0);
    const xStep =
      resolvedPoints.length > 1 ? 100 / (resolvedPoints.length - 1) : 100;

    return resolvedPoints.map((value, idx) => {
      const normalized = maxValue > 0 ? value / maxValue : 0;
      return {
        x: Number((idx * xStep).toFixed(2)),
        y: Number((bottomY - normalized * yRange).toFixed(2)),
      };
    });
  }, [resolvedPoints]);

  const updateActiveIndex = (locationX: number) => {
    if (chartLayout.width <= 0 || resolvedPoints.length === 0) return;
    const clampedX = Math.max(0, Math.min(locationX, chartLayout.width));
    const ratio = chartLayout.width > 0 ? clampedX / chartLayout.width : 0;
    const idx = Math.round(ratio * (resolvedPoints.length - 1));
    const safeIdx = Math.max(0, Math.min(idx, resolvedPoints.length - 1));
    setActiveIndex(safeIdx);
  };

  const onChartGrant = (event: GestureResponderEvent) => {
    updateActiveIndex(event.nativeEvent.locationX);
  };

  const onChartMove = (event: GestureResponderEvent) => {
    updateActiveIndex(event.nativeEvent.locationX);
  };

  const onChartLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setChartLayout({ width, height });
  };

  const activeCoord =
    activeIndex !== null && chartCoords[activeIndex] ? chartCoords[activeIndex] : null;
  const activeAmount =
    activeIndex !== null && resolvedPoints[activeIndex] !== undefined
      ? resolvedPoints[activeIndex]
      : 0;
  const activeLabel =
    activeIndex !== null && currentData.xLabels[activeIndex]
      ? currentData.xLabels[activeIndex]
      : "";
  const activeXPercent = activeCoord ? activeCoord.x / 100 : 0;
  const activeYPercent = activeCoord ? activeCoord.y / 50 : 0;
  const activeXPx = activeXPercent * chartLayout.width;
  const activeYPx = activeYPercent * chartLayout.height;
  const tooltipWidth = 120;
  const tooltipLeft = Math.max(
    0,
    Math.min(chartLayout.width - tooltipWidth, activeXPx - tooltipWidth / 2)
  );
  const tooltipTop = Math.max(0, activeYPx - 42);
  const fallbackLastCoord =
    chartCoords[chartCoords.length - 1] || { x: 100, y: 44 };

  return (
    <View className="bg-card-dark rounded-3xl p-5 border border-white/5 relative overflow-hidden">
      {/* Background glow */}
      <View className="absolute -top-20 -right-20 w-44 h-44 bg-primary/5 rounded-full" />

      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-2">

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
      <View
        className="h-32 w-full mb-2"
        onLayout={onChartLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={onChartGrant}
        onResponderMove={onChartMove}
        onResponderRelease={() => setActiveIndex(null)}
        onResponderTerminate={() => setActiveIndex(null)}
      >
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
            <SvgLinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FF8C32" stopOpacity={0.2} />
              <Stop offset="100%" stopColor="#FF8C32" stopOpacity={0} />
            </SvgLinearGradient>
          </Defs>
          
          {activeCoord && (
            <Line
              x1={activeCoord.x}
              y1={0}
              x2={activeCoord.x}
              y2={50}
              stroke="rgba(255,140,50,0.35)"
              strokeWidth={0.9}
            />
          )}

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
          <Circle
            cx={currentData.chartEndX ?? fallbackLastCoord.x}
            cy={currentData.chartEndY ?? fallbackLastCoord.y}
            r={2}
            fill="#FF8C32"
          />
          {activeCoord && (
            <Circle cx={activeCoord.x} cy={activeCoord.y} r={3} fill="#FF8C32" />
          )}
        </Svg>

        {activeCoord && (
          <View
            style={{
              position: "absolute",
              left: tooltipLeft,
              top: tooltipTop,
              width: tooltipWidth,
            }}
            className="rounded-lg bg-card-dark-secondary border border-white/10 px-2 py-1"
          >
            <Text className="text-white text-xs font-bold">
              ₹{Math.round(activeAmount).toLocaleString()}
            </Text>
            <Text className="text-text-secondary text-[10px]">{activeLabel}</Text>
          </View>
        )}
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
        <PallyIcon size={20} />
        <Text className="text-xs text-text-secondary italic">
          Tap a wallet to see its story
        </Text>
      </View>
    </View>
  );
}
