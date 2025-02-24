import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware";
import {
  addToCart,
  getCartItems,
  removeAllFromCart,
  syncCartToDatabase,
  updateQuantity,
} from "../controllers/cart.controller";

export const cartRoute = express.Router();

cartRoute.post("/", protectedRoute, addToCart);
cartRoute.post("/sync", protectedRoute, syncCartToDatabase);
cartRoute.get("/", protectedRoute, getCartItems);
cartRoute.delete("/clear_cart", protectedRoute, removeAllFromCart);
cartRoute.put("/update/:productId", protectedRoute, updateQuantity);
