import Redis from "ioredis";
import dotenv from "dotenv";
import { AppError } from "../error/GlobalErrorHandler";
dotenv.config();

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) throw new AppError("Redis URL not found", 500);
export const redisClient = new Redis(REDIS_URL);
