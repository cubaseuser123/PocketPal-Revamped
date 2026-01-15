import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import { PageHeader } from "../../../components/ui/PageHeader";
import { GoalPallyTip } from "../../../components/goals/GoalPallyTip";
import { FeaturedGoalCard } from "../../../components/goals/FeaturedGoalCard";
import { OtherGoalCard } from "../../../components/goals/OtherGoalCard";

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();

  const handleAddGoal = () => {
    console.log("Add goal");
  };

  // Custom add button for header
  const AddButton = (
    <TouchableOpacity
      style={styles.headerAddBtn}
      onPress={handleAddGoal}
      activeOpacity={0.8}
    >
      <MaterialIcons name="add" size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <PageHeader
        title="Goals"
        subtitle="What are you saving for?"
        rightContent={AddButton}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Pally Tip */}
        <GoalPallyTip />

        {/* Featured Goal */}
        <FeaturedGoalCard 
            title="Laptop Fund"
            category="Tech Upgrade"
            currentAmount={4800}
            targetAmount={50000}
            icon="💻"
            color="#FF8C32"
            progress={0.096}
            onAdd={() => console.log("add")}
            onView={() => console.log("view")}
        />

        {/* Other Goals List */}
        <View style={styles.otherGoalsSection}>
            <Text style={styles.sectionTitle}>OTHER GOALS</Text>
            
            <OtherGoalCard 
                title="New Phone"
                currentAmount="₹12k"
                targetAmount="₹80k"
                icon="📱"
                color="blue-500"
                progress={0.15}
            />
            
             <OtherGoalCard 
                title="Semester Fees"
                currentAmount="₹25k"
                targetAmount="₹100k"
                icon="🎓"
                color="purple-500"
                progress={0.25}
            />
        </View>

        {/* Create New Goal Button */}
        <TouchableOpacity style={styles.createBtn} activeOpacity={0.9} onPress={handleAddGoal}>
            <View style={styles.createBtnIcon}>
                <MaterialIcons name="add" size={14} color="#FFF" />
            </View>
            <Text style={styles.createBtnText}>Create a New Goal</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F14",
  },
  headerAddBtn: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: "#FF8C32",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 24,
  },
  otherGoalsSection: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B0B0C3",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 4,
    marginBottom: 8,
  },
  createBtn: {
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderStyle: "dashed",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
  },
  createBtnIcon: {
      height: 24,
      width: 24,
      borderRadius: 12,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      alignItems: "center",
      justifyContent: "center",
  },
  createBtnText: {
      color: "#B0B0C3",
      fontSize: 12,
      fontWeight: "700",
  },
});
