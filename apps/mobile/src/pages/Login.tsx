import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
} from "@ionic/react";
import { useState } from "react";
import { auth, useAuth } from "@repo/auth";
import { config } from "../config";
import { useHistory } from "react-router";
import { sparklesOutline } from "ionicons/icons";
import { Capacitor } from "@capacitor/core";

export default function Login() {
  const history = useHistory();
  const { setAuthenticated } = useAuth()!;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"send" | "verify">("send");

  async function handleSendOtp() {
    console.log("Send OTP clicked", { name, email });

    try {
      await auth.sendOtp({ name, email, baseUrl: config.backendUrl });
      console.log("OTP Sent Successfully");
      setStep("verify");
    } catch (err) {
      console.error("OTP send error", err);

      // Show detailed error on native
      if (Capacitor.isNativePlatform()) {
        alert(`Error Details:\n${JSON.stringify(err, null, 2)}`);
      }
    }
  }

  async function handleVerifyOtp() {
    console.log("Verify OTP clicked", { email, otp });

    try {
      await auth.verifyOtp({ email, otp, baseUrl: config.backendUrl });
      console.log("OTP verified, Auth success");
      setAuthenticated(true);
      history.push("/home");
    } catch (err) {
      console.error("OTP verify error", err);
    }
  }

  console.log("Render Login Page");

  return (
    <IonPage>
      <IonContent
        fullscreen
        className="flex h-full flex-col items-center justify-between p-6"
        scrollY={false}
        style={{ "--background": "var(--ion-color-primary)" } as any}
      >
        {/* Header section */}
        <div className="mt-10 text-center text-white">
          <div className="mb-3 flex justify-center">
            <IonIcon icon={sparklesOutline} style={{ fontSize: "48px" }} />
          </div>
          <h1 className="text-3xl font-bold">Welcome to PocketPal</h1>
          <p className="mt-1 text-base opacity-80">
            Smart savings, simplified.
          </p>
        </div>

        {/* Card section */}
        <div className="flex w-full flex-1 flex-col items-center justify-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            {step === "send" && (
              <>
                <IonInput
                  className="rounded-xl bg-gray-100 px-4 py-3"
                  placeholder="Enter your name"
                  fill="solid"
                  onIonChange={(e) => setName(e.detail.value!)}
                />
                <IonInput
                  className="mt-4 rounded-xl bg-gray-100 px-4 py-3"
                  placeholder="Enter your email"
                  fill="solid"
                  onIonChange={(e) => setEmail(e.detail.value!)}
                />

                <IonButton
                  expand="block"
                  className="mt-6 rounded-xl"
                  size="large"
                  onClick={handleSendOtp}
                >
                  Send OTP
                </IonButton>
              </>
            )}

            {step === "verify" && (
              <>
                <IonInput
                  className="rounded-xl bg-gray-100 px-4 py-3"
                  placeholder="Enter OTP"
                  type="number"
                  onIonChange={(e) => setOtp(e.detail.value!)}
                />

                <IonButton
                  expand="block"
                  className="mt-6 rounded-xl"
                  size="large"
                  onClick={handleVerifyOtp}
                >
                  Verify OTP
                </IonButton>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="mb-4 text-sm text-white opacity-70">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </IonContent>
    </IonPage>
  );
}
