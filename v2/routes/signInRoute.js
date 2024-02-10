import bcrypt from "bcryptjs";
import express from "express";
import { User } from "../models/userModel.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      return res.status(400).send({ message: "Send all required fields" });
    }
    const { email, password } = req.body;
    // Find user by email
    const user = await User.findOne({ email });
    if (user) {
      // Compare the provided password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (isPasswordValid) {
        res.status(200).send({ message: "Sign-in successful" });
      } else {
        res.status(401).send({ error: "Invalid password" });
      }
    } else {
      res.status(404).send({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

export default router;
