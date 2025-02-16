import { Types } from "mongoose";
import { NextFunction } from "express";
import { redisClient } from "../lib/redis";
import Product from "../models/product.model";
import { AppError } from "../error/GlobalErrorHandler";

export const getCloudinaryPublicId = (imageUrl: string) => {
  return imageUrl.split("/").pop()?.split(".").slice(0, -1).join(".");
};

export const updateFeaturedProductCache = async (next: NextFunction) => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redisClient.set(
      "featured_products",
      JSON.stringify(featuredProducts)
    );
  } catch (error) {
    next(error);
  }
};

export const updateProductRating = async (
  id: string,
  userId: Types.ObjectId,
  rating: number
) => {
  if (!id) throw new AppError("Product ID is required", 400);
  if (!userId) throw new AppError("User ID is required", 400);

  const product = await Product.findById(id);
  if (!product) throw new AppError("Product not found", 404);

  if (!Array.isArray(product.ratings)) {
    product.ratings = [];
  }

  // Find if user has already rated
  const existingRating = product.ratings.find((r) =>
    r.userId ? r.userId === userId : false
  );

  if (existingRating) {
    existingRating.rating = rating;
  } else {
    product.ratings.push({ userId, rating });
  }

  // pre save hook calculates average ratings
  await product.save();
};
