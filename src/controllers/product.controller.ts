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
    const products = await Product.find({}).sort({ createdAt: -1 });
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
      updatedProduct,
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

/**
 @getProductByCategory Fetch products in two steps to prioritize category match and also 
 include one's where category matches the name as secondary result
 */
export const getProductByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.params;
    const MAX_LIMIT = 100;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(req.query.limit) || 10)
    );
    const skip = (page - 1) * limit;

    const categoryRegex = new RegExp(`^${category}$`, "i");
    const nameRegex = new RegExp(category, "i");

    const [categoryProducts, nameProducts] = await Promise.all([
      Product.find({ category: categoryRegex, isArchived: false })
        .skip(skip)
        .limit(limit),
      Product.find({
        name: nameRegex,
        isArchived: false,
        category: { $ne: category },
      })
        .skip(skip)
        .limit(limit),
    ]);

    const products = [...categoryProducts, ...nameProducts].slice(0, limit);

    const totalProducts = await Product.countDocuments({
      $or: [{ category: categoryRegex }, { name: nameRegex }],
    });

    res.json({
      success: true,
      products,
      pagination: {
        totalProducts,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
      },
    });
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

    product.isFeatured = !product.isFeatured;
    await updateFeaturedProductCache(next);
    const updatedProduct = await product.save();
    res.json({
      success: true,
      isFeatured: updatedProduct.isFeatured,
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

    product.isArchived = !product.isArchived;
    const updatedProduct = await product.save();
    res.json({
      success: true,
      isArchived: updatedProduct.isArchived,
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
    const MAX_LIMIT = 100;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(req.query.limit) || 10)
    );
    const skip = (page - 1) * limit;

    const [products, totalProducts] = await Promise.all([
      Product.find({ isArchived: false }).skip(skip).limit(limit),
      Product.countDocuments({ isArchived: false }),
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        totalProducts,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
      },
    });
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

export const getRelatedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.params;

    if (!category) {
      throw new AppError("Related products needs a category", 400);
    }

    const products = await Product.aggregate([
      { $match: { category: category } },
      { $sample: { size: 4 } },
      {
        $project: {
          _id: 1,
          name: 1,
          image: 1,
          price: 1,
          discountPrice: 1,
          averageRating: 1,
          category: 1,
        },
      },
    ]);

    /*
     * If there are fewer than 4 products in the category, 
       fill the remaining slots with random products from other categories
     */
    if (products.length < 4) {
      const additionalProducts = await Product.aggregate([
        { $match: { category: { $ne: category } } },
        { $sample: { size: 4 - products.length } },
        {
          $project: {
            _id: 1,
            name: 1,
            image: 1,
            price: 1,
            category: 1,
            discountPrice: 1,
            averageRating: 1,
          },
        },
      ]);

      products.push(...additionalProducts);
    }

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
    const MAX_LIMIT = 100;
    const search = req.query.search as string;
    if (!search) throw new AppError("Search query is required", 400);

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(req.query.limit) || 10)
    );
    const skip = (page - 1) * limit;

    const [results, totalProducts] = await Promise.all([
      Product.find({ $text: { $search: search } })
        .sort({ score: { $meta: "textScore" } })
        .skip(skip)
        .limit(limit),
      Product.countDocuments({ $text: { $search: search } }),
    ]);

    res.json({
      success: true,
      products: results,
      pagination: {
        totalProducts,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllMenProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const MAX_LIMIT = 100;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(req.query.limit) || 10)
    );
    const skip = (page - 1) * limit;

    const [products, totalProducts] = await Promise.all([
      Product.find({ isArchived: false, subCategory: "MEN" })
        .skip(skip)
        .limit(limit),
      Product.countDocuments({ isArchived: false, subCategory: "MEN" }),
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        totalProducts,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllKidsProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const MAX_LIMIT = 100;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(req.query.limit) || 10)
    );
    const skip = (page - 1) * limit;

    const [products, totalProducts] = await Promise.all([
      Product.find({ isArchived: false, subCategory: "KIDS" })
        .skip(skip)
        .limit(limit),
      Product.countDocuments({ isArchived: false, subCategory: "KIDS" }),
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        totalProducts,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductsByDifferentCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { mainCategory, otherCategory } = req.params;

    const MAX_LIMIT = 100;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(req.query.limit) || 10)
    );
    const skip = (page - 1) * limit;

    const mainCategoryRegex = new RegExp(mainCategory, "i");
    const otherCategoryRegex = otherCategory
      ? new RegExp(otherCategory, "i")
      : null;

    let filter: any = {
      isArchived: false,
      $or: [{ category: mainCategoryRegex }, { name: mainCategoryRegex }],
    };

    if (otherCategory) {
      filter.$or.push({ category: otherCategoryRegex });
      filter.$or.push({ name: otherCategoryRegex });
    }

    const products = await Product.find(filter).skip(skip).limit(limit);
    const totalProducts = await Product.countDocuments(filter);

    res.json({
      success: true,
      products,
      pagination: {
        totalProducts,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductsByMenCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.params;

    const MAX_LIMIT = 100;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(req.query.limit) || 10)
    );
    const skip = (page - 1) * limit;

    const searchWords = category.trim().split(/\s+/);
    const regexArray = searchWords.map((word) => new RegExp(word, "i"));

    let filter: any = {
      isArchived: false,
      subCategory: "MEN",
      $or: [{ category: { $in: regexArray } }, { name: { $in: regexArray } }],
    };

    const products = await Product.find(filter).skip(skip).limit(limit);
    const totalProducts = await Product.countDocuments(filter);

    res.json({
      success: true,
      products,
      pagination: {
        totalProducts,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};
