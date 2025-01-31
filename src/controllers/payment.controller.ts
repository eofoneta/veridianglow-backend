import { NextFunction, Request, Response } from "express";
import { paystackClient } from "../lib/paystack";
import {
  calculateTax,
  calculateTotal,
  convertToNaira,
  getDeliveryFee,
} from "../utils/payment.util";
import { ObjectId } from "mongoose";
import { AppError } from "../error/GlobalErrorHandler";
import Order from "../models/order.model";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

type CheckoutDetails = {
  userId: ObjectId;
  products: {
    productId: ObjectId;
    quantity: number;
    price: number;
  };
  // couponCode: string;
  location: string;
  email: string;
  currency: "NGN";
};

export const initializeCheckout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { products, location, currency = "NGN" }: CheckoutDetails = req.body;
    const userId = req.user?._id;

    if (!Array.isArray(products) || !products.length) {
      throw new AppError("Invalid or empty products", 400);
    }

    const subtotal = products.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    const amount = calculateTotal(subtotal, location);
    const tax = calculateTax(amount);
    const deliveryFee = getDeliveryFee(location);

    const koboToNaira = convertToNaira(amount);

    const order = new Order({
      userId,
      products,
      subtotal,
      deliveryFee,
      tax,
      totalAmount: amount,
      status: "PENDING",
    });

    const paystackResponse = await paystackClient.transaction.initialize({
      email: req.user?.email!,
      amount: koboToNaira,
      currency,
      metadata: { userId, products, subtotal, deliveryFee, tax },
    });

    order.paystackReference = paystackResponse.data?.reference!;
    await order.save();

    res.status(paystackResponse.status ? 200 : 400).json(paystackResponse);
  } catch (error: any) {
    next(error);
  }
};

export const verifyPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reference } = req.params;

    const paystackResponse = await paystackClient.transaction.verify(reference);
    if (!paystackResponse.status)
      throw new AppError("Invalid reference code", 400);
    if (paystackResponse.data?.status === "failed") {
      throw new AppError("Payment failed", 400);
    }

    res.json({
      status: paystackResponse.data?.status,
      message: paystackResponse.data?.message,
    });
  } catch (error) {
    next(error);
  }
};

export const paystackWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const secret = process.env.PAYSTACK_API_SECRET as string;

    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      throw new AppError("Unauthorized paystack signature", 401);
    }

    const event = req.body;
    console.log("Event", req.body);

    if (event.event === "charge.success") {
      const { reference, customer, amount, currency } = event.data;

      await Order.findOneAndUpdate(
        { paystackReference: reference },
        { status: "PAID" }
      );
      console.log(
        `✅ Payment received from ${customer.email} for ${
          amount / 100
        } ${currency}`
      );
    }
    //  if (event.event === "charge.failed") {
    //   await Order.findOneAndUpdate(
    //     { paystackReference: reference },
    //     { status: "FAILED", transactionDetails: event.data }
    //   );
    //   console.log(
    //     `❌ Payment failed for ${customer.email} for ${amount / 100} ${currency}. Reason: ${status}`
    //   );
    // }
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};
