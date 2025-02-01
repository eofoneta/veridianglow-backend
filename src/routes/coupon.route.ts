import express from "express";
import { adminRoute, protectedRoute } from "../middlewares/auth.middleware";
import {
  generateCoupon,
  getCoupon,
  validateCoupon,
} from "../controllers/coupon.controller";

export const couponRoute = express.Router();

couponRoute.post("/", protectedRoute, generateCoupon);
couponRoute.get("/", protectedRoute, getCoupon);
couponRoute.post("/validate", protectedRoute, validateCoupon);
