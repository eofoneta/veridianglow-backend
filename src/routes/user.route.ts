import express from "express";
import { checkAuth, protectedRoute } from "../middlewares/auth.middleware";
import {
  addAddress,
  editAddress,
  getAddress,
} from "../controllers/user.controller";

export const userRoute = express.Router();

userRoute.post("/address", protectedRoute, addAddress);
userRoute.put("/edit/address", protectedRoute, editAddress);
userRoute.get("/address", checkAuth, getAddress);
