import { NextFunction, Request, Response } from "express";
import { AppError } from "../error/GlobalErrorHandler";
import User from "../models/users.model";
import Product from "../models/product.model";

export const addAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { street, city, state, zipCode, country, buildingType } = req.body;

    if (!street || !city || !state || !zipCode || !country) {
      throw new AppError("All fields are required", 400);
    }

    const user = await User.findById(userId);
    if (!user) throw new AppError("user not found", 404);

    user.address = { street, city, state, zipCode, country, buildingType };
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
    const { street, city, state, zipCode, country, buildingType } = req.body;

    if (!street || !city || !state || !zipCode || !country) {
      throw new AppError("All address fields are required", 400);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { address: { street, city, state, zipCode, country, buildingType } },
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
      message: "User address loaded successfully",
      address: req.user?.address,
    });
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId }: { productId: string } = req.body;
    const user = await User.findById(req.user?.id);
    const exists = user?.wishlist.some((item) => item.productId === productId);
    const product = await Product.findById(productId);
    if (!product) throw new AppError("Product not found", 404);

    if (!exists) {
      user?.wishlist.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        discountPrice: product.discountPrice,
        image: product.image,
        averageRating: product.averageRating,
      });
    }

    await user?.save();

    res.json({
      message: `${product.name} added to wishlist`,
      productId: product.id,
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user?.id);
    if (!user) throw new AppError("User not found", 404);
    const exists = user.wishlist.some((item) => item.productId === productId);
    const product = await Product.findById(productId);

    if (!exists) throw new AppError("product not in wishlist", 404);

    user.wishlist = user?.wishlist.filter(
      (item) => item.productId !== productId
    );

    await user.save();
    res.json({ message: `${product?.name} removed from wishlist` });
  } catch (error) {
    next(error);
  }
};

export const getWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.user?.id);

    res.json({ wishlists: user?.wishlist });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await User.find({}, "firstName lastName email");

    res.json({ users });
  } catch (error) {
    next(error);
  }
};
