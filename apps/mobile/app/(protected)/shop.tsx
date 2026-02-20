import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useShop, type ShopItem } from "../../hooks/useShop";
import { useUser } from "../../hooks/useUser";

const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  shield: { label: "Shields", emoji: "🛡️" },
  skin: { label: "Avatar Skins", emoji: "✨" },
  extra: { label: "Extras", emoji: "🎰" },
  personality: { label: "Pally Personalities", emoji: "🤖" },
};

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();
  const {
    categories,
    shopLoading,
    purchaseItem,
    purchasing,
    refetchShop,
  } = useShop();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchShop();
    setRefreshing(false);
  }, [refetchShop]);

  const handlePurchase = (item: ShopItem) => {
    if (item.owned) return;
    Alert.alert(
      `Buy ${item.emoji} ${item.name}?`,
      `This will cost ${item.price} coins. You have ${user?.coins || 0} coins.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Buy",
          style: "default",
          onPress: async () => {
            try {
              const result = await purchaseItem(item.id);
              Alert.alert("🎉 Purchased!", result.message);
            } catch (error: any) {
              Alert.alert("Error", error.message || "Purchase failed");
            }
          },
        },
      ]
    );
  };

  const categoryKeys = Object.keys(categories);
  const activeCategories = selectedCategory
    ? categoryKeys.filter((k) => k === selectedCategory)
    : categoryKeys;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏪 Coin Shop</Text>
        <View style={styles.coinsBadge}>
          <Text style={styles.coinsText}>{user?.coins || 0} 🪙</Text>
        </View>
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        <TouchableOpacity
          style={[styles.tab, !selectedCategory && styles.tabActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.tabText, !selectedCategory && styles.tabTextActive]}>All</Text>
        </TouchableOpacity>
        {categoryKeys.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.tab, selectedCategory === cat && styles.tabActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.tabText, selectedCategory === cat && styles.tabTextActive]}>
              {CATEGORY_META[cat]?.emoji || "📦"} {CATEGORY_META[cat]?.label || cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF8C32" />
        }
      >
        {shopLoading ? (
          <ActivityIndicator size="large" color="#FF8C32" style={{ marginTop: 40 }} />
        ) : categoryKeys.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏪</Text>
            <Text style={styles.emptyTitle}>Shop is empty</Text>
            <Text style={styles.emptySubtitle}>Check back soon for new items!</Text>
          </View>
        ) : (
          activeCategories.map((cat) => (
            <View key={cat} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>
                {CATEGORY_META[cat]?.emoji || "📦"} {CATEGORY_META[cat]?.label || cat}
              </Text>
              <View style={styles.itemGrid}>
                {categories[cat].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.itemCard, item.owned && styles.itemCardOwned]}
                    onPress={() => handlePurchase(item)}
                    disabled={item.owned || purchasing}
                    activeOpacity={0.7}
                  >
                    {item.owned && (
                      <View style={styles.ownedBadge}>
                        <Text style={styles.ownedText}>OWNED</Text>
                      </View>
                    )}
                    <Text style={styles.itemEmoji}>{item.emoji}</Text>
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                    )}
                    {!item.owned ? (
                      <LinearGradient
                        colors={["#FF8C32", "#FF6B1A"]}
                        style={styles.priceTag}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.priceText}>{item.price} 🪙</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.ownedTag}>
                        <MaterialIcons name="check-circle" size={16} color="#3DDC97" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F14" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16, gap: 12,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  coinsBadge: {
    backgroundColor: "rgba(255, 140, 50, 0.15)",
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(255, 140, 50, 0.3)",
  },
  coinsText: { color: "#FF8C32", fontSize: 14, fontWeight: "700" },
  tabsScroll: { maxHeight: 50 },
  tabsContent: { paddingHorizontal: 20, gap: 8, alignItems: "center" },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "transparent",
  },
  tabActive: { borderColor: "#FF8C32", backgroundColor: "rgba(255,140,50,0.12)" },
  tabText: { color: "#B0B0C3", fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#FF8C32" },
  scrollView: { flex: 1, paddingHorizontal: 20, marginTop: 12 },
  categorySection: { marginBottom: 28 },
  categoryTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", marginBottom: 14 },
  itemGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  itemCard: {
    width: "47%",
    backgroundColor: "#1A1A22",
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
    alignItems: "center", position: "relative",
  },
  itemCardOwned: { opacity: 0.6 },
  ownedBadge: {
    position: "absolute", top: 8, right: 8,
    backgroundColor: "rgba(61, 220, 151, 0.15)",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  ownedText: { color: "#3DDC97", fontSize: 9, fontWeight: "800" },
  itemEmoji: { fontSize: 36, marginBottom: 10 },
  itemName: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", textAlign: "center", marginBottom: 4 },
  itemDesc: { color: "#B0B0C3", fontSize: 11, textAlign: "center", lineHeight: 15, marginBottom: 10 },
  priceTag: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, marginTop: 4,
  },
  priceText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  ownedTag: { marginTop: 6 },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  emptySubtitle: { color: "#B0B0C3", fontSize: 14 },
});
