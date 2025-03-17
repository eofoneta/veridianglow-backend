import { NextFunction, Request, Response } from "express";
import { AppError } from "../error/GlobalErrorHandler";
import User from "../models/users.model";
import {
  generateTokens,
  generateVerificationToken,
  setCookies,
  storeRefreshToken,
} from "../utils/auth.util";
import {
  sendResetPasswordEmail,
  sendResetSuccessEmail,
  sendVerificationEmail,
} from "../email/emailService";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redisClient } from "../lib/redis";
import crypto from "crypto";

export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      throw new AppError("Please provide all required fields", 400);
    }

    const userExists = await User.findOne({ email });
    if (userExists) throw new AppError("User already exists", 400);

    const newUser = new User({ firstName, lastName, email, password });
    await newUser.save({ validateBeforeSave: false });

    const { accessToken, refreshToken } = generateTokens(newUser._id);
    await storeRefreshToken(newUser._id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      status: "success",
      userId: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      isVerified: newUser.isVerified,
      address: newUser.address,
    });
  } catch (error) {
    next(error);
  }
};

export const signIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password }: { email: string; password: string } = req.body;
    if (!email || !password) {
      throw new AppError("Please fill in required fields", 400);
    }

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      throw new AppError("Invalid email or password", 422);
    }

    if (user.role === "ADMIN") {
      const verificationToken = generateVerificationToken();
      const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await user.updateOne({
        verificationToken,
        verificationTokenExpiresAt: otpExpiresAt,
        isVerified: false,
      });

      await sendVerificationEmail(email, verificationToken);

      res.status(200).json({
        message: "OTP sent for admin verification",
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
      });
      return; // exit code after sending OTP to admin
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    res.json({
      status: "success",
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isVerified: user.isVerified,
      address: user.address,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code }: { code: string } = req.body;
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user) throw new AppError("Invalid or expired code", 400);

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiresAt = null;

    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    res.json({
      mesage: "Email verified successfully",
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isVerified: user.isVerified,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) throw new AppError("Refresh token not found", 404);

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as JwtPayload;

    const keys = await redisClient.keys(`refreshToken_${decoded.userId}_*`);
    const storedTokens = await Promise.all(
      keys.map((key) => redisClient.get(key))
    );

    if (!storedTokens.includes(refreshToken)) {
      throw new AppError("Invalid refresh token", 401);
    }

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: "15m",
      }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000, // 15 minutes
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return;

    const forgotPasswordToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1hr

    await user.updateOne({
      resetPasswordToken: forgotPasswordToken,
      resetPasswordExpiresAt: tokenExpiresAt,
    });

    await sendResetPasswordEmail(email, forgotPasswordToken);
    res.json({ message: "Password reset link sent to your email" });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    if (!password) throw new AppError("Please provide a new password", 400);
    if (!user) throw new AppError("Invalid or expired token", 400);

    /**
     * There's a pre-save hook that automatically hash every user's password
     * to the database, Which is why it is assigned directly to the user object
     */
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpiresAt = null;

    await user.save();

    sendResetSuccessEmail(user.email);
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};

export const getProfiles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.json({
      userId: req.user?._id,
      firstName: req.user?.firstName,
      lastName: req.user?.lastName,
      email: req.user?.email,
      role: req.user?.role,
      isVerified: req.user?.isVerified,
      address: req.user?.address,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new AppError("User not logged in", 401);

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as JwtPayload;

    const keys = await redisClient.keys(`refreshToken_${decoded.userId}_*`);
    await Promise.all(keys.map((key) => redisClient.del(key)));

    await User.findOneAndUpdate(
      { _id: decoded.userId },
      { isVerified: false },
      { new: true }
    );

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "User logged out from all devices" });
  } catch (error) {
    next(error);
  }
};
