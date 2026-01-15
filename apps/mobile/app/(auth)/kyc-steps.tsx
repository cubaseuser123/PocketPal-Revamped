import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { PallyIcon } from "../../components/ui/PallyIcon";

export default function KYCStepsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle bounce animation for Pally
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -5,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleStartVerification = () => {
    // Navigate to first KYC step
    router.push("/(auth)/kyc-pan");
  };

  return (
    <View style={styles.container}>
      {/* Background glowing orbs */}
      <LinearGradient
        colors={["rgba(255, 140, 50, 0.1)", "transparent"]}
        style={styles.topGlow}
      />
      <View style={styles.bottomGlow} />

      {/* Main content */}
      <View style={[styles.content, { paddingTop: insets.top + 32 }]}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Complete KYC</Text>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP 1 OF 3</Text>
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>
          </View>
        </View>

        {/* Steps List */}
        <View style={styles.stepsContainer}>
          
          {/* Active Step: Verify PAN */}
          <TouchableOpacity 
            style={styles.activeStepCard}
            onPress={handleStartVerification}
            activeOpacity={0.9}
          >
            <View style={styles.activeIndicator} />
            <View style={styles.activeStepIcon}>
              <MaterialIcons name="badge" size={24} color="#FF8C32" />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.activeStepTitle}>Verify PAN</Text>
              <Text style={styles.activeStepDesc}>Used to keep your wallet secure.</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={20} color="#FF8C32" />
          </TouchableOpacity>

          {/* Inactive Step: Basic Details */}
          <View style={styles.inactiveStepCard}>
            <View style={styles.inactiveStepIcon}>
              <MaterialIcons name="person" size={24} color="rgba(255, 140, 50, 0.6)" />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.inactiveStepTitle}>Basic details</Text>
              <Text style={styles.inactiveStepDesc}>Just the essentials.</Text>
            </View>
            <MaterialIcons name="lock" size={20} color="rgba(176, 176, 195, 0.3)" />
          </View>

          {/* Inactive Step: Selfie / Aadhaar */}
          <View style={styles.inactiveStepCard}>
            <View style={styles.inactiveStepIcon}>
              <MaterialIcons name="camera-front" size={24} color="rgba(255, 140, 50, 0.6)" />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.inactiveStepTitle}>Selfie / Aadhaar</Text>
              <Text style={styles.inactiveStepDesc}>Quick identity check.</Text>
            </View>
            <MaterialIcons name="lock" size={20} color="rgba(176, 176, 195, 0.3)" />
          </View>

        </View>

        {/* Mascot Section */}
        <View style={styles.mascotSection}>
          <View style={styles.mascotContainer}>
            <Animated.View 
              style={[
                styles.speechBubbleContainer,
                { transform: [{ translateY: bounceAnim }] }
              ]}
            >
              <View style={styles.speechBubble}>
                <Text style={styles.speechText}>Almost there</Text>
                <View style={styles.speechTail} />
              </View>
            </Animated.View>
            <PallyIcon size={72} style={{ transform: [{ scaleX: -1 }] }} />
          </View>
        </View>

      </View>

      {/* Bottom Button */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 32 }]}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleStartVerification}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.2)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonShimmer}
          />
          <Text style={styles.buttonText}>Start verification</Text>
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
  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "30%",
  },
  bottomGlow: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 256,
    height: 256,
    backgroundColor: "rgba(255, 140, 50, 0.05)",
    borderRadius: 128,
    opacity: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  stepIndicator: {
    alignItems: "center",
    gap: 8,
    width: 160,
  },
  stepText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B0B0C3",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  progressBarBg: {
    width: "100%",
    height: 6,
    backgroundColor: "#1A1A22",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    width: "33%",
    height: "100%",
    backgroundColor: "#FF8C32",
    borderRadius: 3,
  },
  stepsContainer: {
    gap: 12,
    position: "relative",
    zIndex: 20,
  },
  activeStepCard: {
    backgroundColor: "#1A1A22",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  activeIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#FF8C32",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  activeStepIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 140, 50, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 140, 50, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepInfo: {
    flex: 1,
  },
  activeStepTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  activeStepDesc: {
    fontSize: 13,
    fontWeight: "500",
    color: "#B0B0C3",
  },
  inactiveStepCard: {
    backgroundColor: "#1A1A22",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    opacity: 0.8,
  },
  inactiveStepIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 140, 50, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 140, 50, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  inactiveStepTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 2,
  },
  inactiveStepDesc: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(176, 176, 195, 0.8)",
  },
  mascotSection: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingBottom: 8,
    minHeight: 140,
  },
  mascotContainer: {
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  speechBubbleContainer: {
    position: "absolute",
    top: -48,
    right: 24,
    zIndex: 30,
  },
  speechBubble: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomRightRadius: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  speechText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F0F14",
  },
  speechTail: {
    position: "absolute",
    bottom: -6,
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderTopColor: "#FFFFFF",
  },
  mascotEmoji: {
    fontSize: 72,
    transform: [{ scaleX: -1 }], // Flip the squirrel
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 10 },
    textShadowRadius: 20,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  button: {
    backgroundColor: "#FF8C32",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  buttonShimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
