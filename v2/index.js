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
app.use("/signup", signUpRoute); //sign up route
app.use("/signin", signInRoute); //sign in route
app.use("/forgot-password", forgotPasswordRoute); //forgot password route
app.use("/reset-password", resetPasswordRoute); //reset password route

// database connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("connected");
    app.listen(process.env.PORT, () => {
      console.log(`App is listening....`);
    });
  })
  .catch(() => console.log("no connection"));
