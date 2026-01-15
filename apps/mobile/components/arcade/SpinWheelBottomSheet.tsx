import React, { useCallback, useMemo, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, G, Text as SvgText, Circle } from "react-native-svg";

interface SpinWheelBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function SpinWheelBottomSheet({
  isOpen,
  onClose,
}: SpinWheelBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Snap points: expandable like Pally - 65% (open), 90% (draggable to full)
  const snapPoints = useMemo(() => ["65%", "90%"], []);

  // Expand to correct position when opened (like Pally)
  useEffect(() => {
    if (isOpen && bottomSheetRef.current) {
      // Delay to ensure sheet is fully mounted
      const timer = setTimeout(() => {
        bottomSheetRef.current?.expand();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
      />
    ),
    []
  );

  // Wheel Segments
  const segments = [
    { label: "+10\nCoins", icon: "monetization-on", color: "#FF8C32", textColor: "#4A2000" },
    { label: "+50\nCoins", icon: "payments", color: "#FFD166", textColor: "#5A4000" },
    { label: "+1 Streak\nShield", icon: "shield", color: "#FFA24C", textColor: "#4A2000" },
    { label: "Better\nLuck", icon: "sentiment-satisfied", color: "#FF8C32", textColor: "#4A2000" },
    { label: "+20\nCoins", icon: "attach-money", color: "#FFD166", textColor: "#5A4000" },
    { label: "Mystery\nBox", icon: "inventory-2", color: "#FFA24C", textColor: "#4A2000" },
  ];

  const renderWheelSegment = (index: number, total: number) => {
    const angle = 360 / total;
    const rotate = angle * index;
    const item = segments[index];

    return (
      <View
        key={index}
        style={[
          styles.segmentContainer,
          { transform: [{ rotate: `${rotate}deg` }] }
        ]}
      >
        <View style={styles.segmentContent}>
          <Text style={[styles.segmentText, { color: item.textColor }]}>{item.label}</Text>
          <MaterialIcons name={item.icon as any} size={16} color={item.textColor} />
        </View>
      </View>
    );
  };

  // Return null when not open - forces fresh mount when opening (like Pally)
  if (!isOpen) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      <View style={styles.contentContainer}>
        {/* Header Indicator is handled by BottomSheet props */}
        
        {/* Floating Tooltip */}
        <View style={styles.tooltipContainer}>
           <View style={[styles.tooltip, { transform: [{ rotate: "1deg" }] }]}>
            <Text style={styles.tooltipText}>
              Spin the wheel by saving money — luck loves discipline!
            </Text>
          </View>
        </View>

        {/* Pally floating */}
        <View style={styles.pallyFloating}>
           <View style={[styles.pallyStick, { transform: [{ rotate: "20deg" }] }]} />
           <View style={styles.pallyDot} />
           <Text style={styles.pallyEmoji}>🐿️</Text>
        </View>

        {/* Wheel Container */}
        <View style={styles.wheelWrapper}>
          {/* Pointer */}
          <View style={styles.pointerContainer}>
             <View style={styles.pointerTriangle} />
          </View>

          {/* Main Wheel */}
          <View style={[styles.wheel, { transform: [{ rotate: "15deg" }] }]}>
             {/* Conic Gradient for Background Segments */}
             {/* Note: React Native needs SVG or multiple Views for conic gradient. 
                 Using a simplified approach here with colored Views for segments would be ideal, 
                 but for this conversion we'll simulate the look or stick to a simpler gradient if needed.
                 Crucially, since we can't do easy CSS conic-gradient, we will use an SVG implementation in a real app.
                 For this step, I'll use a hack with absolute positioned rotated semicircles or just a background image if available.
                 Actually, we can just use the provided colors in segments via sector views.
              */}
              <View style={styles.wheelInner}>
                 {segments.map((_, i) => (
                    <View key={i} style={[
                        styles.wheelSector, 
                        { 
                            backgroundColor: segments[i].color,
                            transform: [{ rotate: `${i * 60}deg` }, { skewY: "-30deg" }] 
                        } 
                    ]} />
                 ))}
                 
                 {/* Overlay to mask the sector skewing spillover if any, or just place content on top */}
              </View>

             {/* Inner Shadow Overlay */}
             <View style={styles.innerShadow} />

             {/* Segment Labels */}
             {segments.map((_, i) => renderWheelSegment(i, 6))}
             
             {/* Center Hub */}
             <View style={styles.centerHub}>
                 <View style={styles.spinButton}>
                    <Text style={styles.spinText}>SPIN</Text>
                 </View>
             </View>
          </View>
        </View>

        {/* Info Card - Dark Card Design */}
        <View style={styles.infoCard}>
           <View style={styles.infoGlow} />
           <View style={styles.infoHeader}>
               <View style={styles.infoIconBox}>
                   <MaterialIcons name="restart-alt" size={20} color="#FF8C32" />
               </View>
               <View>
                   <Text style={styles.infoTitle}>Daily Spin</Text>
                   <Text style={styles.infoSubtitle}>Earn more by saving!</Text>
               </View>
           </View>
           <View style={styles.availBadge}>
               <View style={styles.pulseDot} />
               <Text style={styles.availText}>1 Available</Text>
           </View>
        </View>

        {/* Spin Button */}
        <TouchableOpacity style={styles.mainSpinBtn}>
            <LinearGradient
                colors={["rgba(255,255,255,0.2)", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shimmer}
            />
            <Text style={styles.mainSpinText}>Spin Now</Text>
            <MaterialIcons name="sync" size={24} color="#FFF" />
        </TouchableOpacity>

      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#1A1A22",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  handleIndicator: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    width: 48,
    marginTop: 8,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    width: "100%",
    alignItems: "center",
    overflow: "visible", // Allow tooltips to hang out
  },
  tooltipContainer: {
     position: "absolute",
     top: -40,
     left: 10,
     zIndex: 20,
  },
  tooltip: {
      backgroundColor: "#FFF",
      padding: 12,
      paddingHorizontal: 16,
      borderRadius: 16,
      borderBottomLeftRadius: 0,
      maxWidth: 210,
      borderWidth: 2,
      borderColor: "rgba(255, 140, 50, 0.2)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
  },
  tooltipText: {
      color: "#0F0F14",
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 16,
  },
  pallyFloating: {
      position: "absolute",
      top: -20,
      right: 20,
      zIndex: 10,
      alignItems: "center",
  },
  pallyStick: {
      width: 8,
      height: 64,
      backgroundColor: "#3A3A45",
      borderRadius: 4,
      position: "absolute",
      top: -16,
      right: 32,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
  },
  pallyDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: "#FF8C32",
      position: "absolute",
      top: -16,
      right: 26,
      shadowColor: "#FF8C32",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 5,
  },
  pallyEmoji: {
      fontSize: 60,
      zIndex: 10,
      transform: [{ rotate: "-12deg" }, { translateY: 8 }],
  },
  wheelWrapper: {
      width: 300,
      height: 300,
      marginTop: 20,
      marginBottom: 24,
      alignItems: "center",
      justifyContent: "center",
  },
  pointerContainer: {
      position: "absolute",
      top: -10,
      zIndex: 30,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
  },
  pointerTriangle: {
      width: 0,
      height: 0,
      borderLeftWidth: 16,
      borderRightWidth: 16,
      borderTopWidth: 24,
      borderLeftColor: "transparent",
      borderRightColor: "transparent", 
      borderTopColor: "#FFF",
      zIndex: 40,
      // Triangle points DOWN into the wheel
  },
  wheel: {
      width: "100%",
      height: "100%",
      borderRadius: 150,
      borderWidth: 6,
      borderColor: "#25252E",
      backgroundColor: "#1A1A22",
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#FF8C32",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 40,
      elevation: 10,
  },
  wheelInner: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  wheelSector: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 300, // Large enough to cover radius
    height: 300,
    marginTop: -150,
    marginLeft: 0,
    transformOrigin: '0% 50%',
  },
  segmentContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  segmentContent: {
     position: 'absolute',
     top: 16,
     left: 0,
     right: 0,
     alignItems: 'center',
     justifyContent: 'flex-start',
     height: '50%',
     paddingTop: 10,
  },
  segmentText: {
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  innerShadow: {
      position: "absolute",
      width: "100%",
      height: "100%",
      borderRadius: 150,
      // React Native doesn't support easy inner shadows like CSS
      // We can use an overlay with borders or leave simple
      borderWidth: 0, 
  },
  centerHub: {
      position: "absolute",
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "#FFF", // Fallback
      padding: 6,
      zIndex: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 15,
      elevation: 10,
      borderWidth: 6,
      borderColor: "#1A1A22",
  },
  spinButton: {
      flex: 1,
      backgroundColor: "#FFF",
      borderRadius: 40,
      borderWidth: 2,
      borderColor: "rgba(255, 140, 50, 0.2)",
      alignItems: "center",
      justifyContent: "center",
  },
  spinText: {
      color: "#FF8C32",
      fontSize: 14,
      fontWeight: "900",
      letterSpacing: 2,
  },
  infoCard: {
      width: "100%",
      backgroundColor: "#25252E",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
      overflow: "hidden",
  },
  infoGlow: {
      position: "absolute",
      top: -30,
      right: -30,
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: "rgba(255, 140, 50, 0.05)",
  },
  infoHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
  },
  infoIconBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#1A1A22",
      borderWidth: 1,
      borderColor: "rgba(255, 140, 50, 0.3)",
      alignItems: "center",
      justifyContent: "center",
  },
  infoTitle: {
      color: "#FFF",
      fontSize: 14,
      fontWeight: "700",
  },
  infoSubtitle: {
      color: "#B0B0C3",
      fontSize: 10, 
      fontWeight: "500",
  },
  availBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255, 140, 50, 0.15)",
      paddingLeft: 12,
      paddingRight: 16,
       paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "rgba(255, 140, 50, 0.2)",
  },
  pulseDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#FF8C32",
  },
  availText: {
      color: "#FFF",
      fontSize: 12,
      fontWeight: "700",
  },
  mainSpinBtn: {
      width: "100%",
      backgroundColor: "#FF8C32",
      paddingVertical: 16,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      shadowColor: "#FF8C32",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 15,
      elevation: 5,
      overflow: "hidden",
  },
  shimmer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
  },
  mainSpinText: {
      color: "#FFF",
      fontSize: 18,
      fontWeight: "700",
  },
});
