import nodemailer from "nodemailer";
import dotenv from "dotenv";


dotenv.config();
console.log("GMAIL_USER:", process.env.GMAIL_USER);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,           // secure SSL port
  secure: true,        // true for SSL
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS, // MUST BE APP PASSWORD
  },
});

export const sendEmailOTP = async (toEmail, otp) => {
  try {
    const mailOptions = {
      from: `"PocketPal" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: "Your PocketPal OTP",
      text: `Your OTP is ${otp}. Valid for 5 minutes.`,
      html: `<h3>Your PocketPal OTP is <b>${otp}</b></h3><p>Valid for 5 mins.</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, info };

  } catch (err) {
    console.error("Email Error:", err);
    return { success: false, error: err.message };
  }
};
