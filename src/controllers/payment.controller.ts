import { NextFunction, Request, Response } from "express";
import { paystackClient } from "../lib/paystack";
import {
  calculateTax,
  calculateTotal,
  convertToNaira,
  getDeliveryFee,
  handleChargeSuccess,
  PaystackEvent,
  validatePaystackWebhook,
} from "../utils/payment.util";
import { ObjectId } from "mongoose";
import { AppError } from "../error/GlobalErrorHandler";
import Order from "../models/order.model";
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
    const currentDate = new Date();
    const estimatedDeliveryDate = currentDate.setDate(
      currentDate.getDate() + 3
    ); // this is a fixed date and should NOT be used in production

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
      metadata: {
        userId,
        products,
        subtotal,
        deliveryFee,
        tax,
        location,
        estimatedDeliveryDate,
      },
    });

    if (!paystackResponse.status)
      throw new AppError("Error validating trasaction", 400);

    if (!paystackResponse.data?.reference)
      throw new AppError("Paystack referance ID not found", 404);

    order.paystackReference = paystackResponse.data?.reference;
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
    if (!paystackResponse.status) {
      throw new AppError("Invalid reference code", 400);
    }
    
    if (paystackResponse.data?.status === "failed") {
      await Order.findOneAndUpdate(
        { paystackReference: reference },
        {
          status: "FAILED",
        }
      );
      throw new AppError("Payment failed", 400);
    }

    res.json({
      status: paystackResponse.data?.status,
      gatewayResponse: paystackResponse.data?.gateway_response,
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
    if (!secret) {
      throw new AppError("Paystack secret is not configured", 500);
    }

    if (!validatePaystackWebhook(req, secret)) {
      throw new AppError("Unauthorized paystack signature", 401);
    }

    const event = req.body as PaystackEvent;

    if (event.event === "charge.success") {
      await handleChargeSuccess(event);
    }
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};
