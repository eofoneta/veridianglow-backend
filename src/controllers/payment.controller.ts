import { NextFunction, Request, Response } from "express";
import { paystackClient } from "../lib/paystack";
import {
  applyCoupon,
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
import { createCoupon } from "../utils/coupon.util";
dotenv.config();

type CheckoutDetails = {
  userId: ObjectId;
  products: {
    productId: ObjectId;
    quantity: number;
    price: number;
  };
  couponCode: string | undefined;
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
    const {
      products,
      location,
      currency = "NGN",
      couponCode,
    }: CheckoutDetails = req.body;

    const userId = req.user?.id;

    if (!Array.isArray(products) || !products.length) {
      throw new AppError("Invalid or empty products", 400);
    }

    const subtotal = products.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    const amount = calculateTotal(subtotal, location);
    /**
     * tax and delivery have been calculated in calculateTotal function
     * these two are information for metadata
     */
    const tax = calculateTax(amount);
    const deliveryFee = getDeliveryFee(location);

    let discountedTotal = 0;
    if (couponCode) {
      discountedTotal = await applyCoupon(couponCode, userId, subtotal);
    }

    const totalAmount = amount - discountedTotal;

    const order = new Order({
      userId,
      products,
      subtotal,
      deliveryFee,
      tax,
      totalAmount,
      discountedTotal,
      status: "PENDING",
    });

    const paystackResponse = await paystackClient.transaction.initialize({
      email: req.user?.email!,
      amount: convertToNaira(totalAmount),
      currency,
      metadata: {
        couponCode: couponCode,
        userId,
        products,
        subtotal,
        deliveryFee,
        tax,
        location,
        discountedTotal,
        estimatedDeliveryDate: new Date().setDate(new Date().getDate() + 3), // this is a fixed date and should NOT be used in production
      },
    });

    if (!paystackResponse.status || !paystackResponse.data?.reference) {
      throw new AppError("Error validating trasaction", 400);
    }

    order.paystackReference = paystackResponse.data?.reference;
    await order.save();

    // create a free coupon for purchase over 200_000
    if (totalAmount > 200000) {
      await createCoupon(userId, 10);
    }

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
