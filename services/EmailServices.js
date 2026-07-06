import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";

dotenv.config();
console.log("BREVO_SENDER_EMAIL:", process.env.BREVO_SENDER_EMAIL);
console.log("BREVO_API_KEY:", process.env.BREVO_API_KEY ? "EXISTS" : "MISSING");
// =====================
// INIT BREVO CLIENT
// =====================
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];

apiKey.apiKey = process.env.BREVO_API_KEY;

// transactional email API
const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// sender (must be verified in Brevo)
const sender = {
  email: process.env.BREVO_SENDER_EMAIL, // MUST be verified in Brevo
  name: process.env.BREVO_SENDER_NAME || "Connectify",
};

// =====================
// SEND WELCOME EMAIL
// =====================
export const sendWelcomeEmail = async (toEmail, username) => {
  try {
    const response = await tranEmailApi.sendTransacEmail({
      sender,
      to: [{ email: toEmail }],
      subject: "Welcome 🎉 to Connectify",
      htmlContent: `
        <div style="font-family: Arial; padding: 10px;">
          <h2>Welcome ${username} 🚀</h2>
          <p>We're happy to have you on board.</p>
        </div>
      `,
    });

    console.log("✅ Welcome email sent");
    return response;
  } catch (error) {
    console.error(
      "❌ Welcome Email Error:",
      error.response?.body || error.message
    );
    throw error;
  }
};

// =====================
// SEND OTP EMAIL
// =====================
export const sendOTPEmail = async (toEmail, otp) => {
  try {
    const response = await tranEmailApi.sendTransacEmail({
      sender,
      to: [{ email: toEmail }],
      subject: "OTP Verification - Connectify",
      htmlContent: `
        <div style="font-family: Arial; text-align:center;">
          <h2>Your OTP Code</h2>
          <h1 style="letter-spacing: 5px; color: #2563eb;">${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
        </div>
      `,
    });

    console.log("✅ OTP email sent");
    return response;
  } catch (error) {
    console.error(
      "❌ OTP Email Error:",
      error.response?.body || error.message
    );
    throw error;
  }
};