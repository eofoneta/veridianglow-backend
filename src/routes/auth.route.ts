import express from "express";
import {
  forgotPassword,
  getProfiles,
  logout,
  refreshToken,
  resetPassword,
  signIn,
  signUp,
  verifyEmail,
} from "../controllers/auth.controller";
import { checkAuth } from "../middlewares/auth.middleware";

export const authRoute = express.Router();

authRoute.post("/signup", signUp);
authRoute.post("/signin", signIn);
authRoute.post("/logout", logout);
authRoute.post("/verify-email", verifyEmail);
authRoute.post("/forgot-password", forgotPassword);
authRoute.put("/reset-password/:token", resetPassword);
authRoute.post("/refresh-token", refreshToken);
authRoute.get("/profiles", checkAuth, getProfiles);
