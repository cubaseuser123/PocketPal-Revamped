import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useGoals } from "../../hooks/useApi";
import { PallyIcon } from "../../components/ui/PallyIcon";

// Available emojis for goals
const EMOJIS = ["💻", "📱", "🎓", "✈️", "🏠", "🚗", "💍", "🎮", "📸", "🎸", "💊", "🎁"];

// Available colors for goals
const COLORS = [
  "#FF8C32", // Primary orange
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#10B981", // Green
  "#EF4444", // Red
  "#F59E0B", // Yellow
  "#EC4899", // Pink
  "#6366F1", // Indigo
];

export default function CreateGoalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createGoal } = useGoals();
  
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("💻");
  const [selectedColor, setSelectedColor] = useState("#FF8C32");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  
  const targetNum = parseInt(targetAmount) || 0;
  
  const handleCreate = async () => {
    if (!name.trim() || targetNum <= 0) return;
    
    setLoading(true);
    if (__DEV__) {
        console.log("📝 Creating goal:", {
        name: name.trim(),
        emoji: selectedEmoji,
        color: selectedColor,
        category: category.trim() || "General",
        targetAmount: targetNum,
        });
    }
    
    try {
      const result = await createGoal({
        name: name.trim(),
        emoji: selectedEmoji,
        color: selectedColor,
        category: category.trim() || "General",
        targetAmount: targetNum,
        isFeatured: false,
      });
      if (__DEV__) console.log("✅ Goal created successfully:", result);
      router.back();
    } catch (error: any) {
      console.error("❌ Create goal failed:", error);
      console.error("Error details:", error?.message || error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddAmount = (value: number) => {
    const current = parseInt(targetAmount) || 0;
    setTargetAmount((current + value).toString());
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Create Goal</Text>
            <Text style={styles.headerSubtitle}>What are you saving for?</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 180 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Pally Tip */}
        <LinearGradient
          colors={["#2A2A35", "#1A1A22"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.tipCard}
        >
          <View style={styles.tipIcon}>
            <PallyIcon size={24} />
          </View>
          <Text style={styles.tipText}>
            Goals with clear targets are <Text style={styles.tipHighlight}>3x more likely</Text> to be achieved!
          </Text>
        </LinearGradient>

        {/* Goal Preview */}
        <View style={[styles.previewCard, { borderColor: selectedColor }]}>
          <View style={[styles.previewEmoji, { backgroundColor: `${selectedColor}20` }]}>
            <Text style={styles.previewEmojiText}>{selectedEmoji}</Text>
          </View>
          <Text style={styles.previewName}>{name || "Your Goal"}</Text>
          <Text style={styles.previewAmount}>₹{targetNum.toLocaleString()}</Text>
        </View>

        {/* Goal Name */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>GOAL NAME</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g., New Laptop, College Fees"
            placeholderTextColor="#B0B0C3"
            maxLength={30}
          />
        </View>

        {/* Category */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>CATEGORY (OPTIONAL)</Text>
          <TextInput
            style={styles.textInput}
            value={category}
            onChangeText={setCategory}
            placeholder="e.g., Tech, Education, Travel"
            placeholderTextColor="#B0B0C3"
            maxLength={20}
          />
        </View>

        {/* Target Amount */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>TARGET AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.2)"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.quickAmounts}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => handleAddAmount(1000)}>
              <Text style={styles.quickBtnText}>+ ₹1k</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => handleAddAmount(5000)}>
              <Text style={styles.quickBtnText}>+ ₹5k</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => handleAddAmount(10000)}>
              <Text style={styles.quickBtnText}>+ ₹10k</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => handleAddAmount(50000)}>
              <Text style={styles.quickBtnText}>+ ₹50k</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Emoji Picker */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>CHOOSE ICON</Text>
          <View style={styles.emojiGrid}>
            {EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiBtn,
                  selectedEmoji === emoji && { borderColor: selectedColor, backgroundColor: `${selectedColor}20` }
                ]}
                onPress={() => setSelectedEmoji(emoji)}
              >
                <Text style={styles.emojiBtnText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Picker */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>CHOOSE COLOR</Text>
          <View style={styles.colorGrid}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorBtn,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorBtnSelected
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <MaterialIcons name="check" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 100 }]}>
        <TouchableOpacity 
          style={[
            styles.createButton,
            { backgroundColor: selectedColor },
            (!name.trim() || targetNum <= 0 || loading) && styles.createButtonDisabled
          ]}
          onPress={handleCreate}
          disabled={!name.trim() || targetNum <= 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.createButtonText}>
              Create Goal
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F14",
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: "rgba(15, 15, 20, 0.95)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A22",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#B0B0C3",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 24,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#0F0F14",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  tipEmoji: {
    fontSize: 24,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
  },
  tipHighlight: {
    color: "#FF8C32",
    fontWeight: "700",
  },
  previewCard: {
    backgroundColor: "#1A1A22",
    borderWidth: 2,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  previewEmoji: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  previewEmojiText: {
    fontSize: 32,
  },
  previewName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  previewAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  inputSection: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B0B0C3",
    letterSpacing: 1,
  },
  textInput: {
    backgroundColor: "#1A1A22",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A22",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    paddingVertical: 16,
    paddingLeft: 8,
  },
  quickAmounts: {
    flexDirection: "row",
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1A1A22",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  emojiBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#1A1A22",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBtnText: {
    fontSize: 28,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  colorBtnSelected: {
    borderColor: "#FFFFFF",
  },
  bottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  createButton: {
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 10,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
