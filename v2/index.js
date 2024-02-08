import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import forgotPasswordRoute from "./routes/forgotPasswordRoute.js";
import resetPasswordRoute from "./routes/resetPasswordRoute.js";
import signInRoute from "./routes/signInRoute.js";
import signUpRoute from "./routes/signUpRoute.js";

dotenv.config();

const app = express();

//middlewares
app.use(cors());
app.use(express.json());

//routes
app.use("/signup", signUpRoute);
app.use("/signin", signInRoute);
app.use("/forgot-password", forgotPasswordRoute);
app.use("/reset-password", resetPasswordRoute);

// database connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(process.env.PORT);
  })
  .catch();
