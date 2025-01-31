import express from "express";
import { adminRoute, protectedRoute } from "../middlewares/auth.middleware";
import { getCoupon, validateCoupon } from "../controllers/coupon.controller";

export const couponRoute = express.Router();

// couponRoute.post("/", protectedRoute, adminRoute, generateCoupon);
couponRoute.get("/", protectedRoute, getCoupon);
couponRoute.post("/validate", protectedRoute, validateCoupon);
/**
 * TODO - test all coupon route
 */
