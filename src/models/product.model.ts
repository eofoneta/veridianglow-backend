import mongoose, { Document, Model, Types } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  discountPrice: number;
  stock: number;
  isOutOfStock: boolean;
  howToUse?: string;
  image: string;
  category: string;
  subCategory: "MEN" | "WOMEN" | "KIDS" | "ALL";
  brand?: string;
  ingredients?: string[];
  ratings: {
    userId: Types.ObjectId;
    rating: number;
    review?: string;
  }[];
  averageRating: number;
  isFeatured: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new mongoose.Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Please provide product name"],
    },
    description: {
      type: String,
      required: [true, "Please provide product description"],
    },
    price: {
      type: Number,
      required: [true, "Please provide product price"],
    },
    discountPrice: {
      type: Number,
      default: 0.0,
    },
    stock: {
      type: Number,
      required: [true, "Please provide product stock"],
    },
    isOutOfStock: {
      type: Boolean,
      default: false,
    },
    howToUse: {
      type: String,
    },
    image: {
      type: String,
      required: [true, "Please provide product images"],
    },
    category: {
      type: String,
      required: [true, "Please provide product category"],
    },
    subCategory: {
      type: String,
      enum: ["MEN", "WOMEN", "KIDS", "ALL"],
    },
    brand: {
      type: String,
    },
    ingredients: {
      type: [String],
    },
    ratings: [
      {
        userId: { type: Types.ObjectId, ref: "User" },
        rating: { type: Number },
        review: { type: String },
      },
    ],
    averageRating: {
      type: Number,
      default: 0.0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// for effective search optimization
ProductSchema.index(
  { name: "text", description: "text", category: "text" },
  { weights: { name: 3, category: 2, description: 1 } }
);

const Product: Model<IProduct> = mongoose.model<IProduct>(
  "Product",
  ProductSchema
);

export default Product;
