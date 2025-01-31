import mongoose, { Document, Model, ObjectId } from "mongoose";

export interface IOrder extends Document {
  userId: ObjectId;
  products: {
    productId: ObjectId;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  deliveryLocation: string;
  estimatedDeliveryDate: Date;
  tax: number;
  totalAmount: number;
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "FAILED";
  paystackReference: string;
  transactionId: string;
  email: string;
  amountPaid: string;
  currency: string;
  paymentMethod: string;
  transactionDate: Date;
  gatewayResponse: string;
  paystackFees: string;
}

const OrderSchema = new mongoose.Schema<IOrder>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0.0,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0.0,
    },
    subtotal: { type: Number, required: true, min: 0.0 },
    deliveryFee: { type: Number, required: true },
    tax: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "SHIPPED", "DELIVERED", "FAILED"],
      default: "PENDING",
    },
    paystackReference: { type: String, required: true },
    email: String,
    amountPaid: String,
    currency: String,
    paymentMethod: String,
    transactionDate: Date,
    gatewayResponse: String,
    paystackFees: String,
    deliveryLocation: String,
    estimatedDeliveryDate: Date,
  },
  { timestamps: true }
);

const Order: Model<IOrder> = mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
