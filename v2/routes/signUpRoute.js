import express from "express";
import { User } from "../models/userModel.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    if (
      !req.body.name ||
      !req.body.image ||
      !req.body.email ||
      !req.body.password
    ) {
      return res.status(400).send({ message: "Send all required fields" });
    }
    const newUser = {
      name: req.body.name,
      image: req.body.image,
      email: req.body.email,
      password: req.body.password,
      userType: req.body.userType,
    };

    const user = await User.create(newUser);
    return res.status(201).send(user);
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
});

export default router;
