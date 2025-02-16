import { NextFunction, Request, Response } from "express";
import Product, { IProduct } from "../models/product.model";
import cloudinary from "../lib/cloudinary";
import { AppError } from "../error/GlobalErrorHandler";
import {
  getCloudinaryPublicId,
  updateFeaturedProductCache,
  updateProductRating,
} from "../utils/product.util";
import { redisClient } from "../lib/redis";

export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      price,
      discountPrice,
      description,
      image,
      brand,
      category,
      stock,
      howToUse,
      ingredients,
      subCategory,
      isFeatured,
      isArchived,
    }: IProduct = req.body;

    let cloudinaryResponse = null;
    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "veridianglow_product_image",
      });
    }

    const newProduct = await Product.create({
      name,
      price,
      discountPrice,
      description,
      image: cloudinaryResponse?.secure_url,
      brand,
      category,
      stock,
      howToUse,
      ingredients,
      subCategory,
      isFeatured,
      isArchived: isFeatured ? false : isArchived,
    });

    res.json({
      message: "Product created successfully",
      data: newProduct,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError("Invalid product ID format", 400);
    }

    const product = await Product.findOne({ _id: id, isArchived: false });
    if (!product) throw new AppError("Product not found", 404);

    const newStockStatus = product.stock === 0;
    if (product.isOutOfStock !== newStockStatus) {
      product.isOutOfStock = newStockStatus;
      await product.save();
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      discountPrice,
      description,
      image,
      brand,
      category,
      stock,
      howToUse,
      ingredients,
      subCategory,
      isFeatured,
      isArchived,
    }: IProduct = req.body;

    let cloudinaryResponse = null;
    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "veridianglow_product_image",
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        price,
        discountPrice,
        description,
        image: cloudinaryResponse?.secure_url,
        brand,
        category,
        stock,
        howToUse,
        ingredients,
        subCategory,
        isFeatured,
        isArchived: isFeatured ? false : isArchived,
      },
      { new: true }
    );

    res.json({
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    if (product.image) {
      const publicId = getCloudinaryPublicId(product.image);
      try {
        await cloudinary.uploader.destroy(
          `veridianglow_product_image/${publicId}`
        );
        console.log("Image deleted from cloudinary");
      } catch (error) {
        throw new Error("Error deleting image from cloudinary: " + error);
      }
    }

    await Product.findByIdAndDelete(id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const getProductByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category });
    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const toggleFeaturedProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) throw new AppError("Product not found", 404);

    await product.updateOne({
      isFeatured: !product.isFeatured,
      isArchived: product.isFeatured ? false : product.isArchived,
    });
    await updateFeaturedProductCache(next);
    res.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleArchivedProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) throw new AppError("Product not found", 404);

    await product.updateOne({ isArchived: !product.isArchived });
    res.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let featuredProducts: string | null = await redisClient.get(
      "featured_products"
    );
    if (featuredProducts) {
      res.json(JSON.parse(featuredProducts));
      return;
    }

    const featuredProductsArray = await Product.find({
      isFeatured: true,
    }).lean();

    if (
      !Array.isArray(featuredProductsArray) ||
      featuredProductsArray.length === 0
    ) {
      throw new AppError("Featured products not found", 404);
    }

    await redisClient.set(
      "featured_products",
      JSON.stringify(featuredProductsArray),
      "EX",
      900 // 15 minutes
    );
    res.json(featuredProductsArray);
  } catch (error) {
    next(error);
  }
};

// this would be used in like a shop page
export const getUnarchivedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const archivedProducts = await Product.find({ isArchived: false });
    res.json(archivedProducts);
  } catch (error) {
    next(error);
  }
};

export const getTopRatedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const topRatedProducts = await Product.find(
      { rating: { $gt: 3.5 } },
      { isArchived: false }
    );
    res.json(topRatedProducts);
  } catch (error) {
    next(error);
  }
};

export const rateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    await updateProductRating(id, req.user?.id, rating);
    res.json({ message: "Rating submitted successfully." });
  } catch (error) {
    next(error);
  }
};

export const recommendedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const products = await Product.aggregate([
      { $sample: { size: 4 } },
      { $project: { _id: 1, name: 1, description: 1, image: 1, price: 1 } },
    ]);

    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const searchProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const search = req.query.search as string;
    if (!search) throw new AppError("Search query is required", 400);

    const results = await Product.find({
      $text: { $search: search },
    })
      .sort({ score: { $meta: "textScore" } })
      .limit(20);
    res.json(results);
  } catch (error) {
    next(error);
  }
};
