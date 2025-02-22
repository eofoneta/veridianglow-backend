import { NextFunction, Request, Response } from "express";
import { AppError } from "../error/GlobalErrorHandler";
import User from "../models/users.model";

export const addAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { street, city, state, zipCode, country } = req.body;

    if (!street || !city || !state || !zipCode || !country) {
      throw new AppError("All fields are required", 400);
    }

    const user = await User.findById(userId);
    if (!user) throw new AppError("user not found", 404);

    user.address = { street, city, state, zipCode, country };
    await user.save();

    res
      .status(201)
      .json({ message: "Address added successfully", address: user.address });
  } catch (error) {
    next(error);
  }
};

export const editAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { street, city, state, zipCode, country } = req.body;

    if (!street || !city || !state || !zipCode || !country) {
      throw new AppError("All address fields are required", 400);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { address: { street, city, state, zipCode, country } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) throw new AppError("User not found", 404);

    res.json({
      message: "Address updated successfully",
      address: updatedUser.address,
    });
  } catch (error) {
    next(error);
  }
};

export const getAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.json({
      address: req.user?.address,
    });
  } catch (error) {
    next(error);
  }
};
