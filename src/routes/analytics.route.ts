import express from "express";
import { adminRoute, protectedRoute } from "../middlewares/auth.middleware";
import { getAnalytics } from "../controllers/analytics.controller";

export const analyticsRoutes = express.Router();

analyticsRoutes.post("/", protectedRoute, adminRoute, getAnalytics);
