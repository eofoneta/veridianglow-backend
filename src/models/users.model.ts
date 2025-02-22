import mongoose, { CallbackError, Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  cartItems: {
    id?: string;
    quantity: number;
    product: Schema.Types.ObjectId;
  }[];
  wishlist: {
    productId: string;
    name: string;
    averageRating: number;
    image: string;
    price: number;
    discountPrice: number;
  }[];
  role: "CUSTOMER" | "ADMIN";
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  comparePassword: (password: string) => Promise<boolean>;
  lastLogin: Date;
  isVerified: Boolean;
  resetPasswordToken: string | null;
  resetPasswordExpiresAt: Date | null;
  verificationToken: string | null;
  verificationTokenExpiresAt: Date | null;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, "Please provide your first name"],
    },
    lastName: {
      type: String,
      required: [true, "Please provide your last name"],
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    password: {
      type: String,
      minLength: [8, "Password must be 8 or more characters"],
      required: [true, "Please provide your password"],
      select: false,
    },
    cartItems: [
      {
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
      },
    ],
    wishlist: [
      {
        productId: { type: String, required: true },
        image: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number },
        discountPrice: { type: Number, required: true },
        averageRating: { type: Number, required: true },
      },
    ],
    role: {
      type: String,
      enum: ["CUSTOMER", "ADMIN"],
      default: "CUSTOMER",
    },
    address: {
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

    lastLogin: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpiresAt: {
      type: Date,
    },
    verificationToken: {
      type: String,
    },
    verificationTokenExpiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as CallbackError);
  }
});

userSchema.methods.comparePassword = async function (password: string) {
  if (!this.password) {
    const user = await mongoose
      .model("User")
      .findById(this._id)
      .select("+password");
    this.password = user.password;
  }

  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model<IUser>("User", userSchema);

export default User;
