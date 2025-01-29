import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware";
import {
  addToCart,
  getCartItems,
  removeAllFromCart,
  updateQuantity,
} from "../controllers/cart.controller";

export const cartRoute = express.Router();

cartRoute.post("/", protectedRoute, addToCart);
cartRoute.get("/", protectedRoute, getCartItems);
cartRoute.delete("/clear_cart", protectedRoute, removeAllFromCart);
cartRoute.put("/update/:productId", protectedRoute, updateQuantity);
