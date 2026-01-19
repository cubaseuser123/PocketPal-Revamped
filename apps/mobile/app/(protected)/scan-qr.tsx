import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { CameraView, Camera } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import RNQRGenerator from "rn-qr-generator";
import { useWallets } from "../../hooks/useApi";
import { useCustomAlert } from "../../contexts/CustomAlertContext";

export default function ScanQRScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const { wallets, loading } = useWallets();
  const { showAlert } = useCustomAlert();


  // Check KYC status
  const isKycCompleted = wallets?.kycCompleted === true;

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };
    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    
    // Parse UPI intent: upi://pay?pa=...&pn=...&am=...&cu=INR
    if (data.startsWith("upi://")) {
      try {
        const url = new URL(data);
        const params = new URLSearchParams(url.search);
        const payeeVpa = params.get("pa");
        const payeeName = params.get("pn") || "Unknown";
        const amount = params.get("am");
        
        if (amount) {
          router.push({
            pathname: "/(protected)/payment-details",
            params: { payeeName, vpa: payeeVpa, amount }
          } as any);
          setScanned(false); // Reset immediately so back works
        } else {
           router.push({
            pathname: "/(protected)/payment-details",
            params: { payeeName, vpa: payeeVpa }
          } as any);
          setScanned(false);
        }
      } catch (e) {
        showAlert("Invalid QR", "Could not parse UPI QR code.", [
          { text: "Try Again", onPress: () => setScanned(false) }
        ]);
      }
    } else {
      showAlert("Not a UPI QR", "Please scan a valid UPI QR code.", [
        { text: "OK", onPress: () => setScanned(false) }
      ]);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      base64: true, // Native module might need base64 or URI
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      try {
        const response = await RNQRGenerator.detect({
          uri: result.assets[0].uri,
        });

        if (response && response.values && response.values.length > 0) {
           // RNQRGenerator returns values array
           handleBarCodeScanned({ type: "qr", data: response.values[0] });
        } else {
             showAlert("No QR Found", "Could not find a QR code in this image.", [
             { text: "OK", onPress: () => setScanned(false) }
          ]);
        }
      } catch (error) {
        console.error("Gallery scan error:", error);
        showAlert("Error", "Failed to scan image. Please try again.", [
            { text: "OK", onPress: () => setScanned(false) }
        ]);
      }
    }
  };

  if (hasPermission === null || loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  // KYC check - UPI requires Full KYC
  if (!isKycCompleted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MaterialIcons name="lock" size={64} color="#FF8C32" />
        <Text style={styles.kycTitle}>KYC Required</Text>
        <Text style={styles.message}>
          UPI payments require Full KYC verification. Complete your KYC to unlock UPI features.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MaterialIcons name="no-photography" size={64} color="#FF8C32" />
        <Text style={styles.message}>Camera access is required to scan QR codes.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      
      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <LinearGradient
          colors={["rgba(15,15,20,0.9)", "transparent"]}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back-ios" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan UPI QR</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        
        {/* Scanner frame */}
        <View style={styles.frameContainer}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>
        
        {/* Bottom text & Buttons */}
        <LinearGradient
          colors={["transparent", "rgba(15,15,20,0.9)"]}
          style={[styles.footer, { paddingBottom: insets.bottom + 32 }]}
        >
          <Text style={styles.instruction}>Point camera at a UPI QR code</Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
                style={styles.galleryButton}
                onPress={pickImage}
            >
                <MaterialIcons name="photo-library" size={24} color="#FFFFFF" />
                <Text style={styles.galleryButtonText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.galleryButton}
                onPress={() => router.push("/(protected)/pay-contacts" as any)}
            >
                <MaterialIcons name="contacts" size={24} color="#FFFFFF" />
                <Text style={styles.galleryButtonText}>Contacts</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F14",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  message: {
    color: "#B0B0C3",
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
  },
  kycTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#FF8C32",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(26,26,34,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  frameContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#FF8C32",
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: "center",
  },
  instruction: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
  },
  galleryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  galleryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
