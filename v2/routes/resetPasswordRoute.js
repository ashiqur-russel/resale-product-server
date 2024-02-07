import bcrypt from "bcryptjs";
import express from "express";
import nodemailer from "nodemailer";
import { User } from "../models/userModel.js";

const router = express.Router();

// Email configuration (update email settings)
// This is a demo with Gmail service details
const emailConfig = {
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_ADDRESS, // Mail-server address
    pass: process.env.EMAIL_PASSWORD, //password
  },
};

const transporter = nodemailer.createTransport(emailConfig);

// Request to reset the password using the token
router.post("/", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find the user with the provided token and check if it's still valid
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Hash the new password and update it in the database
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
