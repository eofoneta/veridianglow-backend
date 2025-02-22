import { checkAuth, protectedRoute } from "./../middlewares/auth.middleware";
import express from "express";
import {
  addAddress,
  addToWishlist,
  editAddress,
  getAddress,
  getWishlist as getWishlists,
  removeFromWishList,
} from "../controllers/user.controller";

export const userRoute = express.Router();

userRoute.post("/address", protectedRoute, addAddress);
userRoute.put("/edit/address", protectedRoute, editAddress);
userRoute.get("/address", checkAuth, getAddress);
userRoute.get("/wishlist", protectedRoute, getWishlists);
userRoute.post("/wishlist", protectedRoute, addToWishlist);
userRoute.delete("/wishlist/:productId", protectedRoute, removeFromWishList); 
