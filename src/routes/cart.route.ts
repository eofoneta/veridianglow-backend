import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware";
import { syncCartToDatabase } from "../controllers/cart.controller";

export const cartRoute = express.Router();

cartRoute.post("/sync", protectedRoute, syncCartToDatabase);
