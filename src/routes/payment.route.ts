import express from "express";
import {
  initializeCheckout,
  verifyPayment,
} from "../controllers/payment.controller";
import { protectedRoute } from "../middlewares/auth.middleware";

export const paymentRoute = express.Router();

paymentRoute.post("/initialize_checkout", protectedRoute, initializeCheckout);
paymentRoute.get("/verify_payment/:reference", protectedRoute, verifyPayment);
