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
  validateCredentials,
  validatePaystackWebhook,
} from "../utils/payment.util";
import { ObjectId } from "mongoose";
import { AppError } from "../error/GlobalErrorHandler";
import Order from "../models/order.model";
import dotenv from "dotenv";
import { createCoupon } from "../utils/coupon.util";
dotenv.config();

interface CalculateOrder {
  location: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    buildingType?: string;
  };
  couponCode: string | undefined;
  phoneNumber: string;
}

export type CheckoutDetails = {
  phoneNumber: string;
  products: {
    productName: string;
    productId: string;
    quantity: number;
    price: number;
  }[];
  couponCode?: string;
  orderNote?: string;
  location: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    buildingType?: string;
  };
  currency: "NGN";
  subtotal: number;
  deliveryFee: number;
  tax: number;
  totalAmount: number;
  discountedTotal: number;
};

export const calculateOrderDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { location, couponCode, phoneNumber }: CalculateOrder = req.body;

    const userId = req.user?.id;
    const email = req.user?.email;

    const products = req.user?.cartItems.map((item) => ({
      productName: item.name,
      productId: item.id,
      quantity: item.quantity,
      price: item.discountPrice, // this is the default selling price
    }));

    if (!products?.length)
      throw new AppError(
        "Cart is empty. Please add items before checking out",
        400
      );

    await validateCredentials(products, location, phoneNumber);

    const subtotal = products.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    const amount = calculateTotal(subtotal, location.state);

    /**
     * tax and delivery have been calculated in calculateTotal function
     * these two are information for metadata
     */
    const tax = calculateTax(amount);
    const deliveryFee = getDeliveryFee(location.state);

    let discountedTotal = 0;
    if (couponCode) {
      discountedTotal = await applyCoupon(couponCode, userId, subtotal);
    }

    const totalAmount = amount - discountedTotal;

    res.json({
      subtotal,
      tax,
      deliveryFee,
      discountedTotal,
      totalAmount,
      email,
    });
  } catch (error) {
    next(error);
  }
};

export const initializeCheckout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      location,
      currency = "NGN",
      couponCode,
      orderNote,
      phoneNumber,
      subtotal,
      deliveryFee,
      tax,
      totalAmount,
      discountedTotal,
    }: CheckoutDetails = req.body;

    const userId = req.user?.id;
    const products = req.user?.cartItems.map((item) => ({
      productName: item.name,
      productId: item.id,
      quantity: item.quantity,
      price: item.discountPrice, // this is the default selling price
    }));

    const order = new Order({
      userId,
      email: req.user?.email,
      phoneNumber,
      deliveryLocation: location,
      fullName: `${req.user?.firstName} ${req.user?.lastName}`,
      products,
      orderNote: orderNote ?? undefined,
      subtotal,
      deliveryFee,
      tax,
      totalAmount,
      discountedTotal,
      paid: false,
      status: "PENDING",
    });

    const paystackResponse = await paystackClient.transaction.initialize({
      email: req.user?.email!,
      amount: convertToNaira(totalAmount),
      currency,
      metadata: {
        orderId: order.id,
        firstName: req.user?.firstName,
        fullName: `${req.user?.firstName} ${req.user?.lastName}`,
        phoneNumber: order.phoneNumber,
        couponCode: couponCode,
        userId,
        products: order.products,
        subtotal,
        deliveryFee,
        tax,
        location,
        discountedTotal,
        estimatedDeliveryDate: new Date().setDate(new Date().getDate() + 3), // this is a fixed date and should NOT be used in production
      },
      callback_url: `${process.env.FRONTEND_DOMAIN}/payment/verify-payment`,
    });

    if (!paystackResponse.status || !paystackResponse.data?.reference) {
      console.error(paystackResponse);
      throw new AppError(
        "Payment initialization failed. Please try again.",
        400
      );
    }

    order.paystackReference = paystackResponse.data?.reference;
    (order.estimatedDeliveryDate = new Date(
      new Date().setDate(new Date().getDate() + 3)
    )), // this is a fixed date and should NOT be used in production
      // assigning this might not be important
      await order.save();

    // create a free coupon for purchase over 200_000
    if (totalAmount > 200_000) {
      await createCoupon(userId, 10);
    }

    res.status(paystackResponse.status ? 200 : 400).json({
      orderId: order.id,
      paystackResponse,
    });
  } catch (error) {
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
          paid: false,
          status: "FAILED",
          gatewayResponse: paystackResponse.data?.gateway_response,
          currency: paystackResponse.data.currency,
          email: paystackResponse.data.customer.email,
          paymentMethod: paystackResponse.data.authorization.channel,
        }
      );
      throw new AppError("Payment failed", 400);
    }

    res.json({
      status: paystackResponse.data?.status,
      gatewayResponse: paystackResponse.data?.gateway_response,
      orderId: paystackResponse.data?.metadata.orderId,
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
