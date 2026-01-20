import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;

const client = twilio(accountSid, authToken);

/**
 * Send OTP via Twilio Verify service
 * Twilio Verify handles OTP generation internally
 */
export async function sendOTPViaTwilio(phoneNumber: string): Promise<void> {
  try {
    await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: phoneNumber,
        channel: "sms",
      });

    console.log(`[Twilio] Verification sent to ${phoneNumber}`);
  } catch (error) {
    console.error("[Twilio] Failed to send OTP:", error);
    throw new Error("Failed to send verification code");
  }
}

/**
 * Verify OTP via Twilio Verify service
 */
export async function verifyOTPViaTwilio(
  phoneNumber: string,
  code: string
): Promise<boolean> {
  try {
    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: phoneNumber,
        code: code,
      });

    return verification.status === "approved";
  } catch (error) {
    console.error("[Twilio] Failed to verify OTP:", error);
    return false;
  }
}
