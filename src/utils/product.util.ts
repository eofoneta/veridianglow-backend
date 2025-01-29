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
  userId: string,
  rating: number
) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError("Product not found", 404);

  // allow only one rating per user
  const existingRatingIndex = product.ratings.findIndex(
    (r) => r.userId?.toString() === userId
  );

  let updateQuery;
  if (existingRatingIndex !== -1) {
    updateQuery = {
      $set: { "ratings.$[elem].rating": rating },
    };
  } else {
    updateQuery = {
      $push: { ratings: { userId, rating } },
    };
  }

  await Product.updateOne({ _id: id }, updateQuery, {
    arrayFilters: [{ "elem.userId": userId }],
  });

  await updateAverageRating(id);
};

const updateAverageRating = async (productId: string) => {
  const updatedProduct = await Product.findById(productId, "ratings");
  if (!updatedProduct) {
    throw new AppError("Failed to update product rating", 500);
  }

  const totalRatings = updatedProduct.ratings.length;
  const averageRating =
    updatedProduct.ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

  await Product.updateOne({ _id: productId }, { $set: { averageRating } });
};
