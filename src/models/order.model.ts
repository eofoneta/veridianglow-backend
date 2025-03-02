import mongoose, { Document, Model, ObjectId } from "mongoose";

export interface IOrder extends Document {
  userId: ObjectId;
  fullName: string;
  products: {
    productName: string;
    productId: ObjectId;
    quantity: number;
    price: number;
  }[];
  orderNote: string;
  paid: boolean;
  subtotal: number;
  deliveryFee: number;
  deliveryLocation: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  estimatedDeliveryDate: Date;
  tax: number;
  totalAmount: number;
  status:
    | "PENDING"
    | "PAID"
    | "FAILED"
    | "SHIPPED"
    | "DELIVERED"
    | "ABANDONED"
    | "CANCELED";
  paystackReference: string;
  discountedTotal: number;
  transactionId: string;
  email: string;
  phoneNumber: string;
  amountPaid: string;
  currency: string;
  paymentMethod: string;
  transactionDate: Date;
  gatewayResponse: string;
  paystackFees: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new mongoose.Schema<IOrder>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    products: [
      {
        productName: {
          type: String,
          required: true,
        },
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
    paid: {
      type: Boolean,
      default: false,
    },
    orderNote: { type: String },
    totalAmount: {
      type: Number,
      required: true,
      min: 0.0,
    },
    subtotal: { type: Number, required: true, min: 0.0 },
    discountedTotal: { type: Number },
    deliveryFee: { type: Number, required: true },
    tax: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "PENDING",
        "PAID",
        "SHIPPED",
        "DELIVERED",
        "FAILED",
        "CANCELLED",
        "ABANDONED",
      ],
      default: "PENDING",
    },
    paystackReference: { type: String, required: true },
    email: String,
    amountPaid: String,
    currency: String,
    paymentMethod: String,
    transactionDate: Date,
    transactionId: String,
    gatewayResponse: String,
    paystackFees: String,
    deliveryLocation: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
    },
    estimatedDeliveryDate: Date,
  },
  { timestamps: true }
);

const Order: Model<IOrder> = mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
