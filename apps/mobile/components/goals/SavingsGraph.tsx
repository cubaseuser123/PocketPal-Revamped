import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";

export function SavingsGraph() {
  // Mock data for graph - in real app this would come from props/API
  // Simple curve representing savings growth
  const width = 300;
  const height = 100;
  
  // A nice upward curve
  const path = "M0 100 Q 100 80, 150 50 T 300 10";
  const fillPath = "M0 100 Q 100 80, 150 50 T 300 10 V 100 H 0 Z";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Total Savings</Text>
        <Text style={styles.amount}>₹0</Text>
      </View>

      <View style={styles.graphContainer}>
        <Svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
          <Defs>
            <SvgLinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#3DDC97" stopOpacity="0.2" />
              <Stop offset="1" stopColor="#3DDC97" stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
          
          {/* Fill area */}
          <Path
            d={fillPath}
            fill="url(#grad)"
          />
          
          {/* Line */}
          <Path
            d={path}
            stroke="#3DDC97"
            strokeWidth="3"
            fill="none"
          />
        </Svg>
      </View>
      
      <View style={styles.labels}>
        <Text style={styles.label}>Start</Text>
        <Text style={styles.label}>Today</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A22",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: "#B0B0C3",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  amount: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
  },
  graphContainer: {
    height: 100,
    width: "100%",
    marginBottom: 8,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    color: "#B0B0C3",
    fontSize: 12,
  },
});
