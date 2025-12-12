import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonToast,
  IonBackButton,
  IonButtons,
  IonSpinner,
} from "@ionic/react";
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerAndroidScanningLibrary,
  CapacitorBarcodeScannerTypeHint,
} from "@capacitor/barcode-scanner";

const UPIScanner: React.FC = () => {
  const [upiData, setUpiData] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const startScanner = async () => {
    try {
      setError("");
      setUpiData(null);

      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
        scanInstructions: "Position UPI QR code within the frame",
        scanButton: false,
        cameraDirection: 1,
        android: {
          scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.MLKIT,
        },
      });

      console.log("Raw scan result:", result);

      if (result.ScanResult) {
        const text = result.ScanResult.trim();
        console.log("Scanned text:", text);

        if (text.startsWith("upi://") || text.includes("pa=")) {
          const parsed = parseUPI(text);
          if (parsed && parsed.pa) {
            setUpiData(parsed);
          } else {
            setError("Could not parse UPI data from QR code");
          }
        } else {
          setError(`Not a UPI QR code. Scanned: ${text.substring(0, 50)}`);
        }
      } else {
        setError("No data received from scanner");
      }
    } catch (err: any) {
      console.error("Scanner error:", err);
      setError(err.message || "Failed to scan QR code");
    }
  };

  const parseUPI = (uri: string) => {
    try {
      console.log("Parsing URI:", uri);

      let queryString = "";

      if (uri.includes("?")) {
        queryString = uri.split("?")[1];
      } else if (uri.includes("&")) {
        queryString = uri;
      } else {
        console.error("No query parameters found");
        return null;
      }

      const params = new URLSearchParams(queryString);

      const parsed = {
        pa: params.get("pa") || "",
        pn: params.get("pn") || "",
        am: params.get("am") || "",
        tn: params.get("tn") || "",
        cu: params.get("cu") || "INR",
        mc: params.get("mc") || "",
        tr: params.get("tr") || "",
        raw: uri,
      };

      console.log("Parsed UPI data:", parsed);

      if (!parsed.pa) {
        console.error("No PA (payee address) found");
        return null;
      }

      return parsed;
    } catch (err) {
      console.error("Parse UPI error:", err);
      return null;
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonToast
          isOpen={!!error}
          message={error}
          duration={4000}
          color="danger"
          onDidDismiss={() => setError("")}
        />
        <div className="flex min-h-screen flex-col items-center justify-center">
          {/* Initial State - Show Start Button */}
          {!upiData && !error && (
            <div className="mx-auto max-w-md px-5 py-16 text-center">
              <div className="mb-5 text-8xl">📱</div>
              <h2 className="mb-3 text-2xl font-semibold text-gray-800">
                Scan UPI QR Code
              </h2>
              <p className="mb-8 text-base text-gray-500">
                Click the button below to open the camera and scan a UPI payment
                QR code
              </p>
              <IonButton
                expand="block"
                onClick={startScanner}
                size="large"
                color="primary"
              >
                Start Scanner
              </IonButton>
            </div>
          )}

          {/* Scanning State */}
          {scanning && (
            <div className="mx-auto max-w-md px-5 py-16 text-center">
              <IonSpinner
                name="crescent"
                className="mx-auto mb-5 h-16 w-16 text-blue-500"
              />
              <h2 className="mb-3 text-2xl font-semibold text-gray-800">
                Scanning...
              </h2>
              <p className="mb-8 text-base text-gray-500">
                Position the UPI QR code within the camera frame
              </p>
              <IonButton expand="block" onClick={stopScanner} color="danger">
                Cancel Scan
              </IonButton>
            </div>
          )}

          {/* UPI Result */}
          {upiData && (
            <div className="mt-5 rounded-2xl bg-white p-8 shadow-xl">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-3xl text-white">
                ✓
              </div>
              <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800">
                Payment Details
              </h2>
              <div className="space-y-3">
                <div className="flex items-start justify-between border-b border-gray-200 pb-3">
                  <span className="text-sm font-medium text-gray-500">
                    Payee Name
                  </span>
                  <span className="max-w-[60%] text-right text-sm font-semibold break-words text-gray-800">
                    {upiData.pn || "N/A"}
                  </span>
                </div>
                <div className="flex items-start justify-between border-b border-gray-200 pb-3">
                  <span className="text-sm font-medium text-gray-500">
                    UPI ID
                  </span>
                  <span className="max-w-[60%] text-right text-sm font-semibold break-words text-gray-800">
                    {upiData.pa || "N/A"}
                  </span>
                </div>
                <div className="flex items-start justify-between border-b border-gray-200 pb-3">
                  <span className="text-sm font-medium text-gray-500">
                    Amount
                  </span>
                  <span className="max-w-[60%] text-right text-sm font-semibold break-words text-gray-800">
                    {upiData.am ? `₹${upiData.am}` : "Not specified"}
                  </span>
                </div>
                {upiData.tn && (
                  <div className="flex items-start justify-between border-b border-gray-200 pb-3">
                    <span className="text-sm font-medium text-gray-500">
                      Note
                    </span>
                    <span className="max-w-[60%] text-right text-sm font-semibold break-words text-gray-800">
                      {upiData.tn}
                    </span>
                  </div>
                )}
                {upiData.tr && (
                  <div className="flex items-start justify-between pb-3">
                    <span className="text-sm font-medium text-gray-500">
                      Transaction Ref
                    </span>
                    <span className="max-w-[60%] text-right text-sm font-semibold break-words text-gray-800">
                      {upiData.tr}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-6 flex flex-col gap-3">
                <IonButton
                  expand="block"
                  onClick={startScanner}
                  color="primary"
                >
                  Scan Again
                </IonButton>
                <IonButton
                  expand="block"
                  onClick={() => {
                    // TODO: Implement payment logic
                    console.log("Proceed with payment:", upiData);
                  }}
                  color="success"
                >
                  Proceed to Pay
                </IonButton>
              </div>
            </div>
          )}

          {/* Error State */}
          {!upiData && error && (
            <div className="mx-auto max-w-md px-5 py-16 text-center">
              <div className="mb-5 text-8xl">⚠️</div>
              <h2 className="mb-3 text-2xl font-semibold text-red-500">
                Scan Failed
              </h2>
              <p className="mb-8 text-base text-gray-500">{error}</p>
              <IonButton expand="block" onClick={startScanner} size="large">
                Try Again
              </IonButton>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default UPIScanner;
