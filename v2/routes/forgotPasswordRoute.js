import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import nodemailer from "nodemailer";
import { User } from "../models/userModel.js";

const router = express.Router();
dotenv.config();

// Email configuration ( TODO: update email settings )
// This is a demo with Gmail service details
const emailConfig = {
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
};

const transporter = nodemailer.createTransport(emailConfig);

router.post("/", async (req, res) => {
  try {
    const { email } = req.body;

    // Generate a unique reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000;

    // Update user's resetToken and resetTokenExpiry in the database
    const user = await User.findOneAndUpdate(
      { email },
      {
        resetToken,
        resetTokenExpiry,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Send the password reset email
    const resetLink = `http://localhost:${process.env.PORT}/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_ADDRESS,
      to: email,
      subject: "Password Reset",
      text: `Click the link to reset your password: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password reset email sent successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
