import { IonPage, IonContent, IonIcon, isPlatform } from "@ionic/react";
import { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router";
import { useAuth, auth } from "@repo/auth";
import { config } from "../config";
import { arrowBack, sparklesOutline } from "ionicons/icons";

export default function Login() {
  const history = useHistory();
  const { setAuthenticated } = useAuth()!;

  const [step, setStep] = useState<"send" | "verify">("send");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = Array.from({ length: 6 }, () =>
    useRef<HTMLInputElement | null>(null),
  );

  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isAndroid = isPlatform("android");
  const isIOS = isPlatform("ios");

  useEffect(() => {
    let interval: any;
    if (step === "verify" && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const pastedCode = pastedData.replace(/\D/g, "").slice(0, 6);

    if (!pastedCode) return;

    const newOtp = [...otp];
    pastedCode.split("").forEach((char, index) => {
      newOtp[index] = char;
    });
    setOtp(newOtp);

    const focusIndex = Math.min(pastedCode.length, 5);
    inputRefs[focusIndex]?.current?.focus();
  };

  async function handleSendOtp() {
    if (!name.trim() || !email.trim()) return alert("Enter valid name & email");
    try {
      setIsLoading(true);
      await auth.sendOtp({ name, email, baseUrl: config.backendUrl });
      setStep("verify");
      setTimer(30);
      setCanResend(false);
    } catch (err: any) {
      alert(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp() {
    const code = otp.join("");
    if (code.length !== 6) return alert("Enter 6 digits");

    try {
      setIsLoading(true);

      await auth.verifyOtp({ email, otp: code, baseUrl: config.backendUrl });

      const token = await auth.getToken();
      if (!token) {
        throw new Error("Token was not stored properly");
      }

      console.log("[Login] Authentication successful, token stored");
      setAuthenticated(true);
      history.push("/app/home");
    } catch (err: any) {
      console.error("[Login] Verification failed:", err);
      alert(err.message || "Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const arr = [...otp];
    arr[index] = value;
    setOtp(arr);

    if (value && index < 5) inputRefs[index + 1].current?.focus();
  };

  const handleKeyDown = (index: number, e: any) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  function handleResend() {
    setTimer(30);
    setCanResend(false);
    auth.sendOtp({ name, email, baseUrl: config.backendUrl });
  }

  return (
    <IonPage>
      <IonContent
        fullscreen
        className="relative overflow-hidden bg-gradient-to-br from-[#2b0f4b] via-[#1b0f2f] to-black"
      >
        <div className="absolute top-0 -left-20 h-80 w-80 animate-pulse rounded-full bg-purple-600/40 blur-[120px]" />
        <div className="absolute -right-10 bottom-0 h-80 w-80 animate-pulse rounded-full bg-indigo-500/40 blur-[120px]" />

        <div
          className={`relative z-10 flex h-full flex-col items-center justify-between p-6 text-white ${
            isAndroid ? "scale-[1.08]" : "scale-[1]"
          }`}
        >
          <div className={`animate-fade-in mt-24 text-center lg:mt-32`}>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 shadow-inner backdrop-blur-md">
              <IonIcon
                icon={sparklesOutline}
                className="text-white"
                style={{ fontSize: "40px" }}
              />
            </div>
            <h1
              className={`font-bold tracking-tight ${isAndroid ? "text-4xl" : "text-3xl"}`}
            >
              Welcome to PocketPal
            </h1>
            <p
              className={`${isAndroid ? "text-lg" : "text-base"} mt-3 opacity-70`}
            >
              Smart savings, simplified.
            </p>
          </div>

          <div className="flex w-full flex-1 items-start justify-center pt-10">
            <div
              className={`glass-card w-full rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl ${
                isAndroid ? "max-w-md" : "max-w-sm"
              }`}
            >
              {step === "send" && (
                <div className="animate-fade-in flex flex-col gap-5">
                  <div className="space-y-4">
                    <input
                      className={`ion-margin-top w-full rounded-2xl border border-white/10 bg-white/5 px-5 text-white placeholder-white/40 shadow-inner transition-all focus:border-purple-400 focus:bg-white/10 focus:outline-none ${
                        isAndroid ? "py-5 text-lg" : "py-4 text-base"
                      }`}
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />

                    <input
                      className={`ion-margin-top w-full rounded-2xl border border-white/10 bg-white/5 px-5 text-white placeholder-white/40 shadow-inner transition-all focus:border-purple-400 focus:bg-white/10 focus:outline-none ${
                        isAndroid ? "py-5 text-lg" : "py-4 text-base"
                      }`}
                      placeholder="Enter your email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div
                    onClick={handleSendOtp}
                    className={`neo-btn mt-2 w-full rounded-xl bg-linear-to-r from-purple-500 to-indigo-600 py-4 text-center font-semibold text-white shadow-lg shadow-purple-900/20 transition-transform active:scale-[0.98] ${
                      isLoading
                        ? "ion-margin-down pointer-events-none opacity-60"
                        : "cursor-pointer hover:brightness-110"
                    }`}
                  >
                    {isLoading ? "Sending..." : "Send OTP"}
                  </div>
                </div>
              )}

              {step === "verify" && (
                <div className="animate-fade-in space-y-8">
                  <div
                    onClick={() => {
                      setStep("send");
                      setOtp(["", "", "", "", "", ""]);
                    }}
                    className="-ml-2 flex w-fit cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <IonIcon icon={arrowBack} />
                    <span className="text-sm font-medium">Back</span>
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-white">
                      Verification Code
                    </h3>
                    <p className="mt-2 text-sm text-white/60">
                      We sent a code to{" "}
                      <span className="font-medium text-purple-300">
                        {email}
                      </span>
                    </p>
                  </div>

                  <div className="flex w-full justify-between gap-2 px-1">
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        ref={inputRefs[i]}
                        maxLength={1}
                        inputMode="numeric"
                        onPaste={handlePaste}
                        className={`w-full min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 text-center font-bold text-white shadow-inner transition-all focus:border-purple-400 focus:bg-white/10 focus:ring-4 focus:ring-purple-500/10 focus:outline-none ${isAndroid ? "py-4 text-2xl" : "py-3 text-xl"} [appearance:textfield] appearance-none leading-none [-webkit-appearance:none]`}
                        style={{
                          WebkitAppearance: "none",
                          MozAppearance: "textfield",
                          lineHeight: "normal",
                        }}
                        value={d}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                      />
                    ))}
                  </div>

                  <div className="space-y-6">
                    <div
                      onClick={handleVerifyOtp}
                      className={`neo-btn w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 py-4 text-center font-semibold text-white shadow-lg shadow-purple-900/20 transition-transform active:scale-[0.98] ${
                        otp.join("").length < 6 || isLoading
                          ? "pointer-events-none opacity-50 grayscale"
                          : "cursor-pointer hover:brightness-110"
                      }`}
                    >
                      {isLoading ? "Verifying..." : "Verify & Proceed"}
                    </div>

                    <div
                      className={`text-center text-sm font-medium transition-colors ${
                        canResend
                          ? "cursor-pointer text-purple-300 hover:text-purple-200"
                          : "text-white/40"
                      }`}
                      onClick={canResend ? handleResend : undefined}
                    >
                      {canResend
                        ? "Resend Code"
                        : `Resend code in 00:${timer.toString().padStart(2, "0")}`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p
            className={`ion-margin-top text-center text-white/40 ${isIOS ? "pb-4 text-xs" : "pb-8 text-sm"}`}
          >
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
}
