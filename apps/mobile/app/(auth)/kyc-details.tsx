import { View, Text, TouchableOpacity, StyleSheet, Animated, TextInput, Keyboard, TouchableWithoutFeedback, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { PallyIcon } from "../../components/ui/PallyIcon";

export default function KYCDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
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

  const handleContinue = () => {
    if (name.length < 3 || dob.length < 8) return;
    
    setLoading(true);
    // Mock API call
    setTimeout(() => {
      setLoading(false);
      // Navigate to next step
      router.push("/(auth)/kyc-selfie");
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Background glowing orbs */}
      <LinearGradient
        colors={["rgba(255, 140, 50, 0.1)", "transparent"]}
        style={styles.topGlow}
      />
      <View style={styles.bottomGlow} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 32, paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepText}>STEP 2 OF 3</Text>
              <View style={styles.progressBarBg}>
                <View style={styles.progressBarFill} />
              </View>
            </View>
            <View style={{ width: 24 }} />
          </View>

          <Text style={styles.title}>Basic Details</Text>
          <Text style={styles.subtitle}>Confirm your details as they appear on your PAN card.</Text>

          {/* Input Field: Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>FULL NAME (AS ON PAN)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor="#50505E"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Input Field: DOB */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>DATE OF BIRTH (DD/MM/YYYY)</Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#50505E"
              value={dob}
              onChangeText={setDob}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <MaterialIcons name="info-outline" size={20} color="#FFD166" />
            <Text style={styles.infoText}>
              Make sure the details match exactly with your government ID to avoid rejection.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Section */}
      <View style={[styles.fixedBottom, { paddingBottom: insets.bottom + 32 }]}>
        
        {/* Mascot */}
        <View style={styles.mascotContainer}>
          <Animated.View 
            style={[
              styles.speechBubbleContainer,
              { transform: [{ translateY: bounceAnim }] }
            ]}
          >
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>Almost done!</Text>
              <View style={styles.speechTail} />
            </View>
          </Animated.View>
          <PallyIcon size={72} style={{ transform: [{ scaleX: -1 }] }} />
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[styles.button, (name.length < 3 || dob.length < 8) && styles.buttonDisabled]}
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={name.length < 3 || dob.length < 8 || loading}
        >
          {loading ? (
            <Text style={styles.buttonText}>Saving...</Text>
          ) : (
            <>
              <LinearGradient
                colors={["rgba(255,255,255,0.2)", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonShimmer}
              />
              <Text style={styles.buttonText}>Continue</Text>
            </>
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
  scrollContent: {
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
    width: "66%", // Step 2
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
    letterSpacing: 0.5,
  },
  infoCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(255, 209, 102, 0.1)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 209, 102, 0.2)",
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#B0B0C3",
    lineHeight: 18,
  },
  fixedBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    // Ensure clicks pass through to scrollview if this was transparent, but it's not.
    // We want this to sit on top of the scroll content bottom padding.
  },
  mascotContainer: {
    alignItems: "flex-end",
    marginRight: 8,
    marginBottom: 8,
    marginTop: -80, // Allow overlap
    pointerEvents: "none", // Let touches pass through if mascot covers inputs (though it shouldn't here)
  },
  speechBubbleContainer: {
    position: "absolute",
    top: -42,
    right: 60, // Adjust relative to emoji
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
