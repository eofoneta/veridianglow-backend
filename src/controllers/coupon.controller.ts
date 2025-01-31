import { NextFunction, Request, RequestHandler, Response } from "express";
import Coupon from "../models/coupon.model";
import { AppError } from "../error/GlobalErrorHandler";

type codeType = {
  code: string;
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
