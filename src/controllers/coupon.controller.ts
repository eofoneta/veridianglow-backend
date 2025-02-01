import { NextFunction, Request, RequestHandler, Response } from "express";
import Coupon from "../models/coupon.model";
import { AppError } from "../error/GlobalErrorHandler";
import User from "../models/users.model";
import { createCoupon } from "../utils/coupon.util";

type codeType = {
  code: string;
};

export const generateCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, discountPercentage } = req.body;
    if (!email) throw new AppError("Email is required", 400);
    if (!discountPercentage) {
      throw new AppError("discount Percentage is required", 400);
    }

    const user = await User.findOne({ email });
    if (!user) throw new AppError(`user with ${email} not found`, 404);

    const coupon = await createCoupon(user.id, discountPercentage);
    res.json({
      sucess: true,
      coupon: coupon.code,
      discountPercentage: coupon.discountPercentage,
      expiresAt: coupon.expirationDate,
      user: user.email,
    });
  } catch (error) {
    next(error);
  }
};

export const getCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const coupoun = await Coupon.findOne({
      userId: req.user?._id,
      isActive: true,
    });
    if (!coupoun) throw new AppError("No coupon found", 404);

    res.json(coupoun);
  } catch (error) {
    next(error);
  }
};

export const validateCoupon: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code }: codeType = req.body;
    if (!code) throw new AppError("code is required", 400);
    const coupon = await Coupon.findOne({
      code: code,
      userId: req.user?._id,
      isActive: true,
    });

    if (!coupon) throw new AppError("Invalid coupon", 400);

    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false;
      await coupon.save();
      throw new AppError("Coupon expired", 400);
    }

    res.json({
      success: true,
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    });
  } catch (error) {
    next(error);
  }
};
