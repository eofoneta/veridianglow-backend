import crypto from "crypto";
import { Request } from "express";
import Order from "../models/order.model";
import Coupon from "../models/coupon.model";
import { AppError } from "../error/GlobalErrorHandler";
import { ObjectId } from "mongoose";
import Product from "../models/product.model";
import { sendOrderReceivedEmail } from "../email/emailService";
import { CheckoutDetails } from "../controllers/payment.controller";
import { createCoupon } from "./coupon.util";
import { Types } from "mongoose";
import { locationRates } from "../data/locationRates";

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  buildingType?: string;
}

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
      location: Address;
      orderId: string;
      firstName: string;
      userId: Types.ObjectId;
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

export const getDeliveryFee = (address: Address) => {
  const { state, city } = address;

  //@ts-ignore
  const stateRates = locationRates[state];

  if (stateRates) {
    if (stateRates[city]) {
      return stateRates[city];
    }
  } else {
    throw new AppError("Input address might be invalid or unsupported", 422);
  }
};

export const convertToNaira = (amount: number): string => {
  const nairaRate = Math.round(Number(amount) * 100);
  return nairaRate.toString();
};

export const calculateTax = (subtotal: number): number => {
  // const taxRate = 0.075; // 7.5% VAT FOR NIGERIA
  // return subtotal * taxRate;
  return 0; // no tax added for now
};

export const calculateTotal = (subtotal: number, location: Address): number => {
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
  console.log("Meta data response", metadata);
  const bulkOperations = metadata.products.map((product) => ({
    updateOne: {
      filter: { _id: product.productId },
      update: { $inc: { stock: -Number(product.quantity) } },
    },
  }));

  await Product.bulkWrite(bulkOperations);
  const amountPaid = amount / 100;
  // create a free coupon for purchase over 100_000
  if (amountPaid > 100_000) {
    const coupon = await createCoupon(metadata.userId, 10);
    console.log("Coupon generated", coupon.code);
  }

  await sendOrderReceivedEmail(customer.email, event);
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

export const validateCredentials = async (
  products: CheckoutDetails["products"],
  location: CheckoutDetails["location"],
  phoneNumber: CheckoutDetails["phoneNumber"]
): Promise<void> => {
  if (!Array.isArray(products) || !products.length) {
    throw new AppError("Invalid or empty products", 400);
  }

  for (const item of products) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new AppError(`Product '${item.productName}' is not valid`, 400);
    }

    if (item.quantity > product.stock) {
      throw new AppError(
        `Insufficient stock for '${item.productName}'. ${
          product.stock === 0 ? "there's" : "Only"
        } ${product.stock === 0 ? "none" : product.stock} left.`,
        400
      );
    }
  }

  if (
    !location ||
    typeof location !== "object" ||
    !location.street ||
    !location.city ||
    !location.state ||
    !location.country ||
    !location.zipCode
  ) {
    throw new AppError(
      "Invalid location. Please provide full address details.",
      400
    );
  }

  if (!phoneNumber) throw new AppError("Phone number is required", 400);
  validatePhoneNumber(phoneNumber);
};

const validatePhoneNumber = (phoneNumber: string) => {
  const localFormat = /^\d{11}$/;
  const intlFormat = /^\+\d{1,3}\d{6,12}$/;

  if (!localFormat.test(phoneNumber) && !intlFormat.test(phoneNumber)) {
    throw new Error("Invalid Phone Number");
  }

  return phoneNumber; // this returned value is useless
};
