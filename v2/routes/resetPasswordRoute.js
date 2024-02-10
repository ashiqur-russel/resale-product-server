import express from "express";
import { User } from "../models/userModel.js";

const router = express.Router();

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

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
