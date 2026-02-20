import { useQuery } from "@tanstack/react-query";
import { userApi, transactionApi } from "@repo/auth";
import { API_URL } from "./useUser";

export interface DashboardData {
  user: {
    id: string;
    name: string;
    phone: string;
    level: number;
    coins: number;
    avatarUrl: string | null;
    kycCompleted: boolean;
    onboardingCompleted: boolean;
    friendCode: string | null;
  };
  wallets: {
    primary: { balance: number };
    savings: { balance: number };
    total: number;
  };
  goals: Array<{
    id: string;
    name: string;
    emoji: string;
    category: string;
    color: string;
    targetAmount: number;
    currentAmount: number;
    isFeatured: boolean;
    progress: number;
    isCompleted?: boolean;
    createdAt?: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
  }>;
  spendingSummary: {
    week: {
      totalSpent: number;
      avgPerDay: number;
      chartPoints?: number[];
      chartLabels?: string[];
    };
    month: {
      totalSpent: number;
      avgPerDay: number;
      chartPoints?: number[];
      chartLabels?: string[];
    };
    "3m": {
      totalSpent: number;
      avgPerDay: number;
      chartPoints?: number[];
      chartLabels?: string[];
    };
  };
}

type PeriodKey = "week" | "month" | "3m";

interface TransactionPointSource {
  amount: number;
  type: string;
  createdAt: string | Date;
}

interface TrendData {
  chartPoints: number[];
  chartLabels: string[];
}

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toDate = (value: string | Date): Date | null => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const shouldHydrateTrend = (summary: {
  totalSpent: number;
  chartPoints?: number[];
}): boolean => {
  if (!Array.isArray(summary.chartPoints) || summary.chartPoints.length < 2) {
    return true;
  }
  const points = summary.chartPoints.map((p) => Number(p));
  if (points.some((p) => !Number.isFinite(p))) {
    return true;
  }
  const allSame = points.every((p) => p === points[0]);
  return allSame && summary.totalSpent > 0;
};

const sumInRange = (txs: TransactionPointSource[], start: Date, end: Date): number =>
  txs.reduce((sum, tx) => {
    const date = toDate(tx.createdAt);
    if (!date || tx.type !== "expense") return sum;
    if (date >= start && date < end) {
      return sum + Math.abs(Number(tx.amount) || 0);
    }
    return sum;
  }, 0);

const buildWeekTrend = (txs: TransactionPointSource[], now: Date): TrendData => {
  const today = startOfDay(now);
  const dayStarts = Array.from({ length: 7 }, (_, idx) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - idx));
    return day;
  });

  return {
    chartLabels: dayStarts.map((day) =>
      day.toLocaleDateString("en-US", { weekday: "short" })
    ),
    chartPoints: dayStarts.map((start, idx) => {
      const end =
        idx === dayStarts.length - 1
          ? new Date(today.getTime() + 24 * 60 * 60 * 1000)
          : dayStarts[idx + 1];
      return Math.round(sumInRange(txs, start, end));
    }),
  };
};

const buildMonthTrend = (txs: TransactionPointSource[], now: Date): TrendData => {
  const monthStart = startOfDay(new Date(now));
  monthStart.setMonth(monthStart.getMonth() - 1);
  const labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
  const totalMs = Math.max(now.getTime() - monthStart.getTime(), 1);

  return {
    chartLabels: labels,
    chartPoints: labels.map((_, idx) => {
      const start = new Date(monthStart.getTime() + (totalMs * idx) / 4);
      const end =
        idx === labels.length - 1
          ? now
          : new Date(monthStart.getTime() + (totalMs * (idx + 1)) / 4);
      return Math.round(sumInRange(txs, start, end));
    }),
  };
};

const buildThreeMonthTrend = (txs: TransactionPointSource[], now: Date): TrendData => {
  const monthStarts = Array.from({ length: 3 }, (_, idx) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (2 - idx), 1);
    monthDate.setHours(0, 0, 0, 0);
    return monthDate;
  });

  return {
    chartLabels: monthStarts.map((monthDate) =>
      monthDate.toLocaleDateString("en-US", { month: "short" })
    ),
    chartPoints: monthStarts.map((start, idx) => {
      const end =
        idx === monthStarts.length - 1
          ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
          : monthStarts[idx + 1];
      return Math.round(sumInRange(txs, start, end));
    }),
  };
};

export function useDashboard() {
  const {
    data: dashboard,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const data = await userApi.getDashboard(API_URL);
      const dashboardData = data as DashboardData;
      const periods: PeriodKey[] = ["week", "month", "3m"];
      const needsTrendHydration = periods.some((period) =>
        shouldHydrateTrend(dashboardData.spendingSummary[period])
      );

      if (!needsTrendHydration) {
        return dashboardData;
      }

      try {
        const transactionsResponse = await transactionApi.list(API_URL, {
          limit: 300,
          offset: 0,
        });
        const transactions: TransactionPointSource[] = Array.isArray(
          transactionsResponse?.transactions
        )
          ? transactionsResponse.transactions
          : [];
        const now = new Date();
        const fallbackTrends: Record<PeriodKey, TrendData> = {
          week: buildWeekTrend(transactions, now),
          month: buildMonthTrend(transactions, now),
          "3m": buildThreeMonthTrend(transactions, now),
        };

        return {
          ...dashboardData,
          spendingSummary: {
            week: shouldHydrateTrend(dashboardData.spendingSummary.week)
              ? { ...dashboardData.spendingSummary.week, ...fallbackTrends.week }
              : dashboardData.spendingSummary.week,
            month: shouldHydrateTrend(dashboardData.spendingSummary.month)
              ? { ...dashboardData.spendingSummary.month, ...fallbackTrends.month }
              : dashboardData.spendingSummary.month,
            "3m": shouldHydrateTrend(dashboardData.spendingSummary["3m"])
              ? { ...dashboardData.spendingSummary["3m"], ...fallbackTrends["3m"] }
              : dashboardData.spendingSummary["3m"],
          },
        };
      } catch {
        return dashboardData;
      }
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    dashboard,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
