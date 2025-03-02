import express, { NextFunction, Request, Response } from "express";
import {
  calculateOrderDetails,
  initializeCheckout,
  verifyPayment,
} from "../controllers/payment.controller";
import { protectedRoute } from "../middlewares/auth.middleware";
import rateLimit from "express-rate-limit";
import { AppError } from "../error/GlobalErrorHandler";

export const paymentRoute = express.Router();

const orderRateLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 3 minutes
  max: 10, // 10 orders per 3 minutes
  message: "Too many order attempts. Please wait.",
  handler: (req: Request, res: Response, next: NextFunction) => {
    next(new AppError("Too many order attempts. Please wait.", 429));
  },
});

paymentRoute.post(
  "/initialize_checkout",
  protectedRoute,
  orderRateLimiter,
  initializeCheckout
);
paymentRoute.post(
  "/calculate_order",
  protectedRoute,
  orderRateLimiter,
  calculateOrderDetails
);
paymentRoute.get("/verify_payment/:reference", protectedRoute, verifyPayment);
