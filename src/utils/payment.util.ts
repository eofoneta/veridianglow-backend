import crypto from "crypto";
import { Request } from "express";
import Order from "../models/order.model";

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
      location: string;
      estimatedDeliveryDate: Date;
    };
    authorization: {
      channel: string;
    };
  };
}

/**
 * @param fixedDeliveryFees is just for testing, NOT to be used in production
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

  await Order.findOneAndUpdate(
    { paystackReference: reference },
    {
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
  console.log(
    `✅ Payment received: ${customer.email} paid ${
      amount / 100
    } ${currency} via ${authorization.channel}`
  );
};
