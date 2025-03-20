import { NextFunction, Request, Response } from "express";
import Product from "../models/product.model";
import { AppError } from "../error/GlobalErrorHandler";
import User from "../models/users.model";

interface CartItem {
  id: string;
  name: string;
  image: string;
  totalWeight: number;
  weight: number;
  price: number;
  stock: number;
  category: string;
  discountPrice: number;
  quantity: number;
  total: number;
}

export const syncCartToDatabase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cartItems }: { cartItems: CartItem[] } = req.body;
    if (!Array.isArray(cartItems))
      throw new AppError("Invalid cart items", 400);

    const user = await User.findById(req.user?.id);
    if (!user) throw new AppError("User not found", 404);

    user.cartItems = user.cartItems.filter((item) =>
      cartItems.some((newItem) => newItem.id === item.id)
    );

    for (const newItem of cartItems) {
      const product = await Product.findById(newItem.id);
      if (product && product.stock !== newItem.stock) {
        newItem.stock = product.stock;
      }
      if (product && product.discountPrice !== newItem.discountPrice) {
        newItem.discountPrice = product.discountPrice;
        newItem.total = newItem.quantity * product.discountPrice;
      }
    }

    cartItems.forEach((newItem) => {
      const existingItemIndex = user.cartItems.findIndex(
        (item) => item.id === newItem.id
      );
      if (existingItemIndex !== -1) {
        user.cartItems[existingItemIndex].quantity = newItem.quantity;
        user.cartItems[existingItemIndex].total =
          newItem.quantity * newItem.discountPrice;
      } else {
        user.cartItems.push(newItem);
      }
    });

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Cart synced successfully",
      cart: user.cartItems,
    });
  } catch (error) {
    next(error);
  }
};
