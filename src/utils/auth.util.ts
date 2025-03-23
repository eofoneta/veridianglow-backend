import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { redisClient } from "../lib/redis";
import { NextFunction, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../error/GlobalErrorHandler";
dotenv.config();

export const generateTokens = (userId: Types.ObjectId | unknown) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

export const storeRefreshToken = async (
  userId: Types.ObjectId | unknown,
  refreshToken: string
) => {
  const sessionId = uuidv4(); // Generate unique session ID
  const key = `refreshToken_${userId}_${sessionId}`;

  await redisClient.set(key, refreshToken, "EX", 604800); // 7 days
};

export const setCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    maxAge: 15 * 60 * 1000, // 15 minutes
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
};

export const generateVerificationToken = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const validatePassword = (password: string) => {
  if (password.length < 8)
    throw new Error("Password must be at least 8 characters long");
};
