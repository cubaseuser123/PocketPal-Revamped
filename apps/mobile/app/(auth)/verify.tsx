import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { auth, useAuth, storage } from "@repo/auth";
import { API_URL } from "../../hooks/useApi";



export default function VerifyScreen() {
  const router = useRouter();
  const { phone, source } = useLocalSearchParams<{ phone: string; source: string }>();
  const insets = useSafeAreaInsets();
  const authContext = useAuth();
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(30); // Start with cooldown
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete OTP");
      return;
    }

    setLoading(true);
    setError("");

    let shouldStopLoading = true;
    Keyboard.dismiss();

    try {
      const response = await auth.verifyOtp({
        phone: phone || "",
        otp: otpString,
        baseUrl: API_URL,
      });
      
      
      if (source === "register") {
        // Registration flow: Show success toast then redirect to login
        // DO NOT set authenticated=true here, enabling it triggers auto-navigation to onboarding
        
        // Clear token immediately so we ensure we are clean
        await storage.remove("access_token");
        
        setSuccess(true);
        shouldStopLoading = false; // Keep loading spinner showing (or toast visible)

        setTimeout(() => {
          router.replace("/(auth)/login");
        }, 2000);
      } else {
        // Normal login flow
        authContext?.setAuthenticated(true);

        const user = (response as any)?.user;
        const onboardingComplete = user?.onboardingCompleted === true;

        // Small delay to allow auth state to propagate to useAuthNavigation
        // preventing race condition where router moves before auth=true is seen
        setTimeout(() => {
          if (onboardingComplete) {
            router.replace("/(protected)/(tabs)");
          } else {
            router.replace("/(auth)/onboarding");
          }
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
    } finally {
      if (shouldStopLoading) {
        setLoading(false);
      }
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    setError("");
    
    try {
      await auth.sendOtp({
        name: "",
        phone: phone || "",
        baseUrl: API_URL,
      });
      setError("");
      setResendCooldown(30); // Start cooldown after successful resend
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Format phone for display (mask middle digits)
  const maskedPhone = phone ? 
    `${phone.slice(0, 4)}****${phone.slice(-4)}` : 
    "";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.content, { paddingTop: insets.top + 12 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Verify your phone</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to{"\n"}
            <Text style={styles.phoneHighlight}>{maskedPhone}</Text>
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
                error && styles.otpInputError,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
              keyboardType="number-pad"
              maxLength={6}
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={16} color="#FF4B4B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Resend */}
        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResend}
          disabled={loading || resendCooldown > 0}
        >
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <Text style={[styles.resendLink, resendCooldown > 0 && { opacity: 0.5 }]}>
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
          </Text>
        </TouchableOpacity>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Button */}
        <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonShimmer}
            />
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.buttonText}>Verify & Continue</Text>
                <MaterialIcons name="check" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Success Toast */}
      {success && (
        <View style={styles.successToast}>
          <View style={styles.successToastContent}>
            <MaterialIcons name="check-circle" size={24} color="#3DDC97" />
            <View style={styles.successToastText}>
              <Text style={styles.successToastTitle}>Account Verified! 🎉</Text>
              <Text style={styles.successToastSubtitle}>Redirecting to login...</Text>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F14",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A22",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#B0B0C3",
    lineHeight: 22,
  },
  phoneHighlight: {
    color: "#FF8C32",
    fontWeight: "600",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 16,
  },
  otpInput: {
    flex: 1,
    height: 56,
    backgroundColor: "#1A1A22",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  otpInputFilled: {
    borderColor: "#FF8C32",
    backgroundColor: "rgba(255, 140, 50, 0.1)",
  },
  otpInputError: {
    borderColor: "#FF4B4B",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#FF4B4B",
  },
  resendButton: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    color: "#B0B0C3",
  },
  resendLink: {
    fontSize: 14,
    color: "#FF8C32",
    fontWeight: "600",
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    paddingTop: 16,
  },
  button: {
    backgroundColor: "#FF8C32",
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  buttonDisabled: {
    opacity: 0.7,
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
  successToast: {
    position: "absolute",
    bottom: 50,
    left: 24,
    right: 24,
    zIndex: 9999,
  },
  successToastContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A22",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#3DDC97",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successToastText: {
    flex: 1,
    gap: 2,
  },
  successToastTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  successToastSubtitle: {
    fontSize: 13,
    color: "#B0B0C3",
  },
});
