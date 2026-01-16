import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { storage, useAuth, userApi } from "@repo/auth";
import { PallyIcon } from "../../components/ui/PallyIcon";

// Storage key for onboarding completion
const ONBOARDING_COMPLETE_KEY = "onboarding_complete";

export default function KYCSelfieScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const authContext = useAuth();
  const [loading, setLoading] = useState(false);
  const [mockCameraActive, setMockCameraActive] = useState(true);

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

  const handleCapture = async () => {
    setLoading(true);
    setMockCameraActive(false);
    
    // Mock processing delay
    setTimeout(async () => {
      await finishOnboarding();
    }, 2000);
  };

  const finishOnboarding = async () => {
    try {
      // Call API to complete KYC
      const { API_URL } = await import("../../hooks/useApi");
      
      try {
        await userApi.completeKyc(API_URL);
        console.log("✅ KYC marked complete in backend");
      } catch (apiError) {
        console.error("Error calling completeKyc API:", apiError);
        // Continue even if API fails - user can complete later
      }
      
      // Mark onboarding as complete locally
      await storage.set(ONBOARDING_COMPLETE_KEY, "true");
      
      // Navigate to add money screen after KYC completion
      router.replace("/(auth)/add-money");
    } catch (error) {
      console.error("Error saving onboarding state:", error);
      router.replace("/(auth)/add-money");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background glows */}
      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />

      {/* Main content */}
      <View style={[styles.content, { paddingTop: insets.top + 32 }]}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP 3 OF 3</Text>
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.title}>Take a Selfie</Text>
        <Text style={styles.subtitle}>Last step! Just to make sure it's really you.</Text>

        {/* Mock Camera View */}
        <View style={styles.cameraContainer}>
          <View style={styles.cameraFrame}>
            {mockCameraActive ? (
              <View style={styles.cameraPreview}>
                <View style={styles.cameraOverlay}>
                  <MaterialIcons name="face" size={64} color="rgba(255,255,255,0.5)" />
                </View>
                <View style={styles.cameraCornerTL} />
                <View style={styles.cameraCornerTR} />
                <View style={styles.cameraCornerBL} />
                <View style={styles.cameraCornerBR} />
              </View>
            ) : (
             <View style={styles.processingView}>
               <MaterialIcons name="check-circle" size={48} color="#3DDC97" />
               <Text style={styles.processingText}>Verifying...</Text>
             </View>
            )}
          </View>
          <Text style={styles.cameraTip}>
            Make sure your face is clearly visible and within the frame.
          </Text>
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
                <Text style={styles.speechText}>Smile! 📸</Text>
                <View style={styles.speechTail} />
              </View>
            </Animated.View>
            <PallyIcon size={72} style={{ transform: [{ scaleX: -1 }] }} />
          </View>
        </View>

        {/* Bottom Button */}
        <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 32 }]}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleCapture}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.buttonText}>Finishing...</Text>
            ) : (
              <>
                <LinearGradient
                  colors={["rgba(255,255,255,0.2)", "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonShimmer}
                />
                <Text style={styles.buttonText}>Click Selfie & Finish</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  stepIndicator: {
    alignItems: "center",
    gap: 8,
    width: 120,
  },
  stepText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B0B0C3",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  progressBarBg: {
    width: "100%",
    height: 4,
    backgroundColor: "#1A1A22",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    width: "100%", // Step 3
    height: "100%",
    backgroundColor: "#FF8C32",
    borderRadius: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#B0B0C3",
    marginBottom: 32,
    lineHeight: 22,
  },
  cameraContainer: {
    alignItems: "center",
    gap: 16,
  },
  cameraFrame: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: "#FF8C32",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#1A1A22",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraPreview: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2A2A35",
    alignItems: "center",
    justifyContent: "center",
  },
  processingView: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1A1A22",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  processingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cameraOverlay: {
    alignItems: "center",
    justifyContent: "center",
  },
  cameraTip: {
    fontSize: 13,
    color: "#B0B0C3",
    textAlign: "center",
    maxWidth: 240,
  },
  // Camera Corners
  cameraCornerTL: {
    position: "absolute",
    top: 40,
    left: 40,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: "#FFFFFF",
    borderTopLeftRadius: 8,
  },
  cameraCornerTR: {
    position: "absolute",
    top: 40,
    right: 40,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "#FFFFFF",
    borderTopRightRadius: 8,
  },
  cameraCornerBL: {
    position: "absolute",
    bottom: 40,
    left: 40,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: "#FFFFFF",
    borderBottomLeftRadius: 8,
  },
  cameraCornerBR: {
    position: "absolute",
    bottom: 40,
    right: 40,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: "#FFFFFF",
    borderBottomRightRadius: 8,
  },
  mascotSection: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingBottom: 8,
    minHeight: 120,
  },
  mascotContainer: {
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  speechBubbleContainer: {
    position: "absolute",
    top: -42,
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
    transform: [{ scaleX: -1 }],
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
