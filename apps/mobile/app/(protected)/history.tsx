import { useState, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useTransactions } from "../../hooks/useApi";
import { TransactionList } from "../../components/wallets/TransactionList";

// Helper to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  
  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + `, ${time}`;
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { transactions, loading, refetch } = useTransactions();

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Map transactions for the list
  const formattedTransactions = (transactions || []).map(t => ({
    id: t.id,
    name: t.name,
    emoji: t.emoji,
    amount: t.amount,
    date: formatDate(t.createdAt),
    categoryColor: "#FF8C32", // Default color
  }));

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0F14", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#FF8C32" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F14" }}>
      {/* Header */}
      <View style={{ 
        flexDirection: "row", 
        alignItems: "center", 
        paddingHorizontal: 20, 
        paddingBottom: 20,
        paddingTop: insets.top + 12
      }}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: "#1A1A22", alignItems: "center", justifyContent: "center",
            marginRight: 16
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#FFF" }}>Transaction History</Text>
      </View>

      <ScrollView 
        contentContainerStyle={{ 
          paddingHorizontal: 20, 
          paddingBottom: insets.bottom + 20 
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF8C32" />}
      >
        <TransactionList 
          transactions={formattedTransactions} 
          title={`All Transactions (${formattedTransactions.length})`}
        />
        
        {formattedTransactions.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 40, opacity: 0.5 }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>💸</Text>
            <Text style={{ color: "#FFF", fontSize: 16 }}>No transactions yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
