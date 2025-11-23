import React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip } from "recharts";
import { Capacitor } from "@capacitor/core";

const platform = Capacitor.getPlatform();

interface ChartDataPoint {
  name: string;
  saved: number;
  spent: number;
}

interface SpendingAnalysisChartProps {
  data: ChartDataPoint[];
  chartColor: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs text-white">
        <p className="font-semibold">{payload[0].payload.name}</p>
        <p className="text-green-400">Saved: ₹{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const SpendingAnalysisChart: React.FC<SpendingAnalysisChartProps> = ({
  data,
  chartColor,
}) => {
  return (
    <div className="glass-card ion-margin-top mx-6 p-4 text-white">
      <div className="mb-3">
        <h3 className="text-lg font-semibold">Spending Analysis</h3>
      </div>
      <div className="h-48">
        <AreaChart
          width={340}
          height={180}
          data={data}
          margin={{
            top: 5,
            right: platform === "ios" ? 30 : 0,
            left: platform === "ios" ? 0 : 5,
            bottom: 5,
          }}
        >
          <defs>
            <linearGradient id="colorGraph" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            dy={10}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: "rgba(255,255,255,0.2)",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />
          <Area
            type="monotone"
            dataKey="saved"
            stroke={chartColor}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorGraph)"
          />
        </AreaChart>
      </div>
    </div>
  );
};

export default SpendingAnalysisChart;
