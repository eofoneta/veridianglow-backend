import crypto from "crypto";
import { Request } from "express";
import Order from "../models/order.model";
import Coupon from "../models/coupon.model";
import { AppError } from "../error/GlobalErrorHandler";
import { ObjectId } from "mongoose";
import Product from "../models/product.model";
import { sendOrderReceivedEmail } from "../email/emailService";

export interface PaystackEvent {
  event: string;
  data: {
    reference: string;
    customer: {
      email: string;
    };
    amount: number;
    fees: number;
    id: string;
    currency: string;
    status?: string;
    gateway_response: string;
    paid_at: Date;
    metadata: {
      products: {
        productName: string;
        productId: ObjectId;
        quantity: string; // metadata returns it as string
        price: number;
      }[];
      location: string;
      orderId: string;
      firstName: string;
      userId: string;
      couponCode: string;
      deliveryFee: number;
      discount: number;
      estimatedDeliveryDate: Date;
    };
    authorization: {
      channel: string;
    };
  };
}

/**
 * @function fixedDeliveryFees is just for testing, NOT to be used in production
 */
const fixedDeliveryFees: Record<string, number> = {
  lagos: 1000,
  abuja: 1500,
  port_harcourt: 1800,
  kano: 2000,
  others: 2500,
};

export const getDeliveryFee = (location: string): number => {
  const baseFee =
    fixedDeliveryFees[location.toLowerCase()] || fixedDeliveryFees["others"];
  return baseFee;
};

export const convertToNaira = (amount: number): string => {
  const nairaRate = amount * 100;
  return nairaRate.toString();
};

export const calculateTax = (subtotal: number): number => {
  const taxRate = 0.075; // 7.5% VAT FOR NIGERIA
  return subtotal * taxRate;
};

export const calculateTotal = (subtotal: number, location: string): number => {
  const deliveryFee = getDeliveryFee(location);
  const tax = calculateTax(subtotal);
  const totalAmount = subtotal + deliveryFee + tax;
  return totalAmount;
};

/**
 * Web hook helpers
 */
export const validatePaystackWebhook = (
  req: Request,
  secret: string
): boolean => {
  const hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  return hash === req.headers["x-paystack-signature"];
};

export const handleChargeSuccess = async (event: PaystackEvent) => {
  const {
    reference,
    id,
    amount,
    currency,
    paid_at,
    customer,
    authorization,
    gateway_response,
    fees,
    metadata,
  } = event.data;

  if (metadata.couponCode) {
    await Coupon.findOneAndUpdate(
      { code: metadata.couponCode },
      { isActive: false }
    );
  }

  await Order.findOneAndUpdate(
    { paystackReference: reference },
    {
      paid: true,
      status: "PAID",
      deliveryLocation: metadata.location,
      estimatedDeliveryDate: metadata.estimatedDeliveryDate,
      email: customer.email,
      amountPaid: amount / 100,
      transactionId: id,
      currency,
      paymentMethod: authorization.channel,
      transactionDate: paid_at,
      gatewayResponse: gateway_response,
      paystackFees: fees / 100,
    }
  );

  /**
   * @bulkOperations Reduce stock by purchased quantity
   */
  const bulkOperations = metadata.products.map((product) => ({
    updateOne: {
      filter: { _id: product.productId },
      update: { $inc: { stock: -Number(product.quantity) } },
    },
  }));

  await sendOrderReceivedEmail(customer.email, event);
  await Product.bulkWrite(bulkOperations);
  console.log(
    `✅ Payment received: ${customer.email} paid ${
      amount / 100
    } ${currency} via ${authorization.channel}`
  );
};

/**
 * Coupon helpers
 */
export function calculateDiscountedTotal(
  discountPercentage: number,
  total: number
): number {
  return total * (discountPercentage / 100);
}

/**
 * Applies a coupon to the subtotal if the coupon is valid and not expired.
 * @returns The discounted total after applying the coupon.
 */
export const applyCoupon = async (
  couponCode: string,
  userId: string,
  subtotal: number
): Promise<number> => {
  const coupon = await Coupon.findOne({
    code: couponCode,
    isActive: true,
    userId,
  });

  if (!coupon) {
    throw new AppError("Invalid or used coupon", 400);
  }

  const currentDate = new Date();
  if (coupon.expirationDate < currentDate) {
    throw new AppError("Coupon has expired", 400);
  }

  return calculateDiscountedTotal(coupon.discountPercentage, subtotal);
};
