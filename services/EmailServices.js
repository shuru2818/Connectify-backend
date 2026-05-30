import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.APP_EMAIL,
    pass: process.env.APP_PASS,
  },
});

export const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from:"Connectify ChatApp",
    to: email,
    subject: "OTP Verification",
    text: `Your OTP is ${otp}`,
  });
};

