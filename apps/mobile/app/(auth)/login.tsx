import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { auth } from "@repo/auth";
import { AUTH_URL } from "../../hooks/useApi";


export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, "");
    setPhone(cleaned);
  };

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }
    
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
      
      // For login, we don't send a name - Better Auth will create user on verify
      await auth.sendOtp({
        phone: formattedPhone,
        authUrl: AUTH_URL,
      });
      
      router.push({
        pathname: "/(auth)/verify",
        params: { phone: formattedPhone, source: "login" },
      });
      
      // Start 30-second cooldown
      setCooldown(30);
    } catch (err: any) {
      // Check if this is a "new user" error
      if (err.message?.includes("Name required") || err.data?.isNewUser) {
        setError("Account not found. Please register first.");
      } else {
        setError(err.message || "Failed to send OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleRegister = () => {
    router.push("/(auth)/register");
  };

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
          <Text style={styles.title}>Welcome Back! 👋</Text>
          <Text style={styles.subtitle}>
            Enter your phone number to login to your account
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="phone"
                size={20}
                color="#B0B0C3"
                style={styles.inputIcon}
              />
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#6B6B7B"
                value={phone}
                onChangeText={formatPhoneNumber}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={15}
              />
            </View>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={16} color="#FF4B4B" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Bottom Section */}
        <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}>
          <TouchableOpacity
            style={[styles.button, (loading || cooldown > 0) && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={loading || cooldown > 0}
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
            ) : cooldown > 0 ? (
              <Text style={styles.buttonText}>Wait {cooldown}s</Text>
            ) : (
              <>
                <Text style={styles.buttonText}>Send OTP</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A22",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  countryCode: {
    fontSize: 16,
    color: "#B0B0C3",
    fontWeight: "600",
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: "#FFFFFF",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    color: "#FF4B4B",
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    paddingTop: 16,
    gap: 16,
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
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    fontSize: 14,
    color: "#B0B0C3",
  },
  registerLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FF8C32",
  },
});
