import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useUser } from "../../hooks/useApi";
import { useCustomAlert } from "../../contexts/CustomAlertContext";
import { useState } from "react";

export default function FullKycBenefitsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeKyc, refetch, user } = useUser();
  const { showAlert } = useCustomAlert();
  const [loading, setLoading] = useState(false);

  const handleCompleteKyc = async () => {
    setLoading(true);
    try {
      // Simulate a delay for "Processing" feel
      await new Promise(resolve => setTimeout(resolve, 2000));
      await completeKyc();
      await refetch();
      showAlert("Success", "KYC Verification Completed! You are now a verified user.");
      router.back();
    } catch (error: any) {
      showAlert("Error", error.message || "Failed to complete KYC");
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: "payments",
      title: "Unlimited Transactions",
      desc: "Remove all daily limits on adding or withdrawing money.",
      color: "#4ADE80"
    },
    {
      icon: "qr-code-scanner",
      title: "UPI & Scan Pay",
      desc: "Unlock direct UPI payments to any merchant.",
      color: "#60A5FA"
    },
    {
      icon: "verified",
      title: "Verified Badge",
      desc: "Show off your verified status on leaderboards.",
      color: "#F472B6"
    },
    {
      icon: "trending-up",
      title: "1.5x XP Boost",
      desc: "Earn more experience points for every goal completed.",
      color: "#FACC15"
    }
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0F0F14", "#181824"]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={["#FF8C32", "#F97316"]}
              style={styles.iconBackground}
            >
              <MaterialIcons name="verified-user" size={48} color="#FFF" />
            </LinearGradient>
          </View>
          <Text style={styles.heroTitle}>Unlock Full Potential</Text>
          <Text style={styles.heroSubtitle}>
            Complete your KYC to access all premium features and remove limits.
          </Text>
        </View>

        {/* Benefits List */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.sectionTitle}>What you get</Text>
          
          {benefits.map((item, index) => (
            <View key={index} style={styles.benefitCard}>
              <View style={[styles.benefitIcon, { backgroundColor: `${item.color}20` }]}>
                <MaterialIcons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>{item.title}</Text>
                <Text style={styles.benefitDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <MaterialIcons name="lock" size={16} color="#94A3B8" />
          <Text style={styles.securityText}>
            Your data is encrypted and secure. We verify instantly with government databases.
          </Text>
        </View>

      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={handleCompleteKyc}
          disabled={loading}
        >
          <LinearGradient
            colors={["#FF8C32", "#EA580C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.ctaText}>Complete KYC Now</Text>
            )}
          </LinearGradient>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    paddingBottom: 120,
  },
  hero: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  heroTitle: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  heroSubtitle: {
    color: "#94A3B8",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  benefitsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  benefitCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  benefitDesc: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 32,
    marginTop: 24,
    gap: 8,
  },
  securityText: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: "rgba(15, 15, 20, 0.9)", // slightly distinct
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  ctaButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#FF8C32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
