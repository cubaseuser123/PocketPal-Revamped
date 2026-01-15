import { View, Text, TouchableOpacity, StyleSheet, Animated, TextInput, Keyboard, TouchableWithoutFeedback } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { PallyIcon } from "../../components/ui/PallyIcon";

export default function KYCPanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const [panNumber, setPanNumber] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleVerify = () => {
    if (panNumber.length < 10) return;
    
    setLoading(true);
    // Mock API call
    setTimeout(() => {
      setLoading(false);
      // Navigate to next step
      router.push("/(auth)/kyc-details");
    }, 1500);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepText}>STEP 1 OF 3</Text>
              <View style={styles.progressBarBg}>
                <View style={styles.progressBarFill} />
              </View>
            </View>
            <View style={{ width: 24 }} /> {/* Spacer for centering */}
          </View>

          <Text style={styles.title}>What is your PAN?</Text>
          <Text style={styles.subtitle}>We need this to verify your identity as per RBI regulations.</Text>

          {/* Input Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>PAN NUMBER</Text>
            <TextInput
              style={styles.input}
              placeholder="ABCDE1234F"
              placeholderTextColor="#50505E"
              value={panNumber}
              onChangeText={(text) => setPanNumber(text.toUpperCase())}
              maxLength={10}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <MaterialIcons name="security" size={20} color="#3DDC97" />
            <Text style={styles.infoText}>
              Your PAN details are encrypted and stored securely. We do not share this with anyone.
            </Text>
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
                <Text style={styles.speechText}>Takes 10 seconds ⚡️</Text>
                <View style={styles.speechTail} />
              </View>
            </Animated.View>
            <PallyIcon size={72} style={{ transform: [{ scaleX: -1 }] }} />
          </View>
        </View>

        {/* Bottom Button */}
        <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 32 }]}>
          <TouchableOpacity
            style={[styles.button, panNumber.length < 10 && styles.buttonDisabled]}
            onPress={handleVerify}
            activeOpacity={0.8}
            disabled={panNumber.length < 10 || loading}
          >
            {loading ? (
              <Text style={styles.buttonText}>Verifying...</Text>
            ) : (
              <>
                <LinearGradient
                  colors={["rgba(255,255,255,0.2)", "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonShimmer}
                />
                <Text style={styles.buttonText}>Verify & Continue</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
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
    width: "33%",
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
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B0B0C3",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#1A1A22",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  infoCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(61, 220, 151, 0.1)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(61, 220, 151, 0.2)",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#B0B0C3",
    lineHeight: 18,
  },
  mascotSection: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingBottom: 8,
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
  buttonDisabled: {
    backgroundColor: "#2A2A35",
    shadowOpacity: 0,
    elevation: 0,
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
