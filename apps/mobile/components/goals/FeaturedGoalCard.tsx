import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Path } from "react-native-svg";

interface FeaturedGoalCardProps {
  title: string;
  category: string;
  currentAmount: number;
  targetAmount: number;
  icon: string;
  color: string;
  progress: number; // 0 to 1
  onAdd: () => void;
  onView: () => void;
}

export function FeaturedGoalCard({
  title,
  category,
  currentAmount,
  targetAmount,
  icon,
  color,
  progress,
  onAdd,
  onView,
}: FeaturedGoalCardProps) {
  const percent = (progress * 100).toFixed(1);

  return (
    <View style={styles.groupContainer}>
      <View style={styles.glowBg} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={["#2A2A35", "#0F0F14"]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.icon}>{icon}</Text>
            </View>
            <View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.category}>{category}</Text>
            </View>
          </View>
          <View style={styles.percentBadge}>
            <Text style={styles.percentText}>{percent}%</Text>
          </View>
        </View>

        {/* Amount & Graph */}
        <View style={styles.middleRow}>
          <View>
            <Text style={styles.amount}>₹{currentAmount.toLocaleString()}</Text>
            <Text style={styles.target}>of ₹{targetAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.graphContainer}>
             <Svg width="100%" height="100%" viewBox="0 0 100 50" preserveAspectRatio="none">
                <Defs>
                   <SvgGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor="#FF8C32" stopOpacity="0.4" />
                      <Stop offset="100%" stopColor="#FF8C32" stopOpacity="0" />
                   </SvgGradient>
                </Defs>
                <Path d="M0,50 L12,42 L25,45 L37,35 L50,38 L62,25 L75,30 L87,15 L100,20 V50 H0 Z" fill="url(#grad1)" />
                <Path d="M0,50 L12,42 L25,45 L37,35 L50,38 L62,25 L75,30 L87,15 L100,20" fill="none" stroke="#FF8C32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
             </Svg>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
           <View style={[styles.progressBarFill, { width: `${percent}%` }]}>
              <LinearGradient 
                 colors={["#FF8C32", "#FFD166"]} 
                 start={{x:0, y:0}} 
                 end={{x:1, y:0}} 
                 style={StyleSheet.absoluteFill} 
              />
              <View style={styles.progressPulse} />
           </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
           <TouchableOpacity style={styles.addButton} onPress={onAdd} activeOpacity={0.8}>
               <MaterialIcons name="add-circle" size={16} color="#FFF" />
               <Text style={styles.addButtonText}>Add to Goal</Text>
           </TouchableOpacity>
           
           <TouchableOpacity style={styles.viewButton} onPress={onView} activeOpacity={0.8}>
               <Text style={styles.viewButtonText}>View Details</Text>
           </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  groupContainer: {
    position: "relative",
    marginVertical: 8,
  },
  glowBg: {
    position: "absolute",
    inset: -2,
    backgroundColor: "rgba(255, 140, 50, 0.3)",
    borderRadius: 24,
    opacity: 0.3,
  },
  container: {
    backgroundColor: "#1A1A22",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    height: 48,
    width: 48,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 22,
  },
  category: {
    fontSize: 10,
    color: "#B0B0C3",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  percentBadge: {
    backgroundColor: "#0F0F14",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  percentText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFD166",
  },
  middleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  amount: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  target: {
    fontSize: 12,
    color: "#B0B0C3",
    fontWeight: "500",
    marginTop: 2,
  },
  graphContainer: {
    height: 48,
    width: 112,
    opacity: 0.9,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: "#0F0F14",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
    overflow: "hidden",
    position: 'relative'
  },
  progressPulse: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    opacity: 0.5,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  addButton: {
    flex: 1,
    backgroundColor: "#FF8C32",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 3,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  viewButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  viewButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
