import { Paystack } from "paystack-sdk";
import dotenv from "dotenv";
dotenv.config();

export const paystackClient = new Paystack(process.env.PAYSTACK_API_SECRET!);
