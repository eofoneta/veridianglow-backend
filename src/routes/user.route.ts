import {
  adminRoute,
  checkAuth,
  protectedRoute,
} from "./../middlewares/auth.middleware";
import express from "express";
import {
  addAddress,
  addToWishlist,
  editAddress,
  getAddress,
  getAllUsers,
  getWishlist as getWishlists,
  removeFromWishList,
} from "../controllers/user.controller";

export const userRoute = express.Router();

userRoute.get("/", protectedRoute, adminRoute, getAllUsers);
userRoute.post("/address", protectedRoute, addAddress);
userRoute.put("/edit/address", protectedRoute, editAddress);
userRoute.get("/address", checkAuth, getAddress);
userRoute.get("/wishlist", checkAuth, getWishlists);
userRoute.post("/wishlist", protectedRoute, addToWishlist);
userRoute.delete("/wishlist/:productId", protectedRoute, removeFromWishList);
