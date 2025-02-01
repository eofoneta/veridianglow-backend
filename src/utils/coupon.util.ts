import { Types } from "mongoose";
import Coupon from "../models/coupon.model";

export const createCoupon = async (
  userId: Types.ObjectId,
  discountPercentage: number
) => {
  return await new Coupon({
    code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    discountPercentage,
    expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
    userId,
  }).save();
};
