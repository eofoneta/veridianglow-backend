import express from "express";
import {
  createProduct,
  deleteProduct,
  getAllKidsProducts,
  getAllMenProducts,
  getAllProducts,
  getFeaturedProducts,
  getProductByCategory,
  getProductById,
  getProductsByDifferentCategory,
  getProductsByMenCategory,
  getRelatedProducts,
  getTopRatedProducts,
  getUnarchivedProducts,
  rateProduct,
  recommendedProducts,
  searchProducts,
  toggleArchivedProduct,
  toggleFeaturedProduct,
  updateProduct,
} from "../controllers/product.controller";
import { adminRoute, protectedRoute } from "../middlewares/auth.middleware";

export const productRoute = express.Router();

productRoute.get(
  "/",
  // protectedRoute,
  //  adminRoute,
  getAllProducts
);
productRoute.post(
  "/",
  //  protectedRoute,
  // adminRoute,
  createProduct
);
productRoute.put("/update/:id", protectedRoute, adminRoute, updateProduct);
productRoute.delete("/delete/:id", protectedRoute, adminRoute, deleteProduct);
productRoute.get("/category/:category", getProductByCategory);
productRoute.patch(
  "/update_feature/:id",
  // protectedRoute,
  // adminRoute,
  toggleFeaturedProduct
);
productRoute.patch(
  "/update_archived/:id",
  // protectedRoute,
  // adminRoute,
  toggleArchivedProduct
);
productRoute.get("/featured", getFeaturedProducts);
productRoute.get("/all_unarchived", getUnarchivedProducts);
productRoute.get("/top_rated", getTopRatedProducts);
productRoute.patch("/rate_product/:id", protectedRoute, rateProduct);
productRoute.get("/recommended", recommendedProducts);
productRoute.get("/men", getAllMenProducts);
productRoute.get("/kids", getAllKidsProducts);
productRoute.get(
  "/different_category/:mainCategory/:otherCategory?", // bro i had to name it this way because man i'm not touching express anymore :(
  getProductsByDifferentCategory
);
productRoute.get(
  "/men_category/:category",
  getProductsByMenCategory
);
productRoute.get("/related_products/:category", getRelatedProducts);
productRoute.get("/search", searchProducts);
productRoute.get("/find_product/:id", getProductById);
