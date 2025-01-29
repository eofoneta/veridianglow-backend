import { NextFunction, Request, Response } from "express";
import Product from "../models/product.model";
import { AppError } from "../error/GlobalErrorHandler";

export const addToCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    const existingItem = user?.cartItems.find(
      (item) => item?.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user?.cartItems.push({ product: productId, quantity: 1 });
    }

    await user?.save();
    res.json(user?.cartItems);
  } catch (error) {
    next(error);
  }
};

export const getCartItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const productIds = req.user?.cartItems.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    const cartItems = products.map((product) => {
      const item = req.user?.cartItems.find(
        (cartItem) => cartItem.product.toString() === product.id
      );
      return {
        id: product.id,
        name: product.name,
        image: product.image,
        category: product.category,
        price: product.price,
        discountPrice: product.discountPrice,
        quantity: item?.quantity || 1,
      };
    });

    res.json(cartItems);
  } catch (error) {
    next(error);
  }
};

export const removeAllFromCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    if (!productId) {
      user!.cartItems = [];
    } else {
      user!.cartItems =
        user?.cartItems.filter((item) => item.id !== productId) || [];
    }
    await user?.save();
    res.json({ message: "Cart cleared" });
  } catch (error) {
    next(error);
  }
};

export const updateQuantity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;
    // not required, middleware handles this
    if (!user) throw new AppError("Unauthorized", 400);

    const existingItem = user?.cartItems.find(
      (item) => item.product.toString() === productId
    );

    if (!existingItem) throw new AppError("Product not found", 404);

    if (quantity === 0) {
      user.cartItems = user?.cartItems.filter(
        (item) => item.product.toString() !== productId
      );
    } else {
      existingItem.quantity = quantity;
    }

    await user?.save();
    res.json(user?.cartItems);
  } catch (error) {
    next(error);
  }
};
