import mongoose, { Model, ObjectId } from "mongoose";

interface ICoupon extends Document {
  code: string;
  discountPercentage: number;
  expirationDate: Date;
  isActive: boolean;
  userId: ObjectId;
}

const CouponSchema = new mongoose.Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: [0, "Discount percentage must be greater than 0"],
      max: [100, "Discount percentage must be less than 100"],
    },
    expirationDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Coupon: Model<ICoupon> = mongoose.model<ICoupon>("Coupon", CouponSchema);

export default Coupon;
