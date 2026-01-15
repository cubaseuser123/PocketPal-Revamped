import twilio from "twilio";

// Lazy initialization - client created on first use
let client = null;

const getClient = () => {
  if (client) return client;
  
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    console.error("❌ Twilio credentials missing");
    return null;
  }
  
  try {
    client = twilio(accountSid, authToken);
    console.log("✅ Twilio client initialized");
    return client;
  } catch (err) {
    console.error("❌ Twilio Client Init Error:", err);
    return null;
  }
};

/**
 * Send OTP via Twilio Verify API
 * @param {string} phoneNumber - Recipient phone number
 * @returns {Promise<{success: boolean, status?: string, error?: string}>}
 */
export const sendVerificationOTP = async (phoneNumber) => {
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  const twilioClient = getClient();
  
  // Format phone number - add +91 if not present
  let toContact = phoneNumber;
  if (!phoneNumber.startsWith("+")) {
    toContact = `+91${phoneNumber}`;
  }

  // Check if Twilio is configured
  if (!twilioClient || !verifyServiceSid) {
    console.error("❌ Twilio Verify not configured");
    return { success: false, error: "SMS service not configured" };
  }

  try {
    console.log(`📤 Sending Twilio Verify to: ${toContact}`);
    
    const verification = await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: toContact,
        channel: "sms",
      });

    console.log(`✅ Twilio Verify Sent: ${verification.status}`);
    return { success: true, status: verification.status };
  } catch (err) {
    console.error("❌ Twilio Verify Send Error:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Verify OTP via Twilio Verify API
 * @param {string} phoneNumber - Phone number that received OTP
 * @param {string} code - OTP code entered by user
 * @returns {Promise<{success: boolean, status?: string, error?: string}>}
 */
export const checkVerificationOTP = async (phoneNumber, code) => {
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  const twilioClient = getClient();
  
  // Format phone number - add +91 if not present
  let toContact = phoneNumber;
  if (!phoneNumber.startsWith("+")) {
    toContact = `+91${phoneNumber}`;
  }

  // Check if Twilio is configured
  if (!twilioClient || !verifyServiceSid) {
    console.error("❌ Twilio Verify not configured");
    return { success: false, error: "SMS service not configured" };
  }

  try {
    console.log(`🔍 Verifying OTP for: ${toContact}`);
    
    const verificationCheck = await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: toContact,
        code: code,
      });

    console.log(`📋 Twilio Verify Check: ${verificationCheck.status}`);
    
    if (verificationCheck.status === "approved") {
      return { success: true, status: verificationCheck.status };
    } else {
      return { success: false, error: "Invalid or expired OTP", status: verificationCheck.status };
    }
  } catch (err) {
    console.error("❌ Twilio Verify Check Error:", err.message);
    return { success: false, error: err.message };
  }
};
