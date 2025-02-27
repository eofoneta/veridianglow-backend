import { NextFunction, Request, Response } from "express";
import { AppError } from "../error/GlobalErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import User, { IUser } from "../models/users.model";
import dotenv from "dotenv";
dotenv.config();

declare module "express-serve-static-core" {
  interface Request {
    user?: IUser;
  }
}

export const protectedRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      throw new AppError("User not authenticated", 401);
    }

    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET!
    ) as JwtPayload;
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) throw new AppError("User not found", 404);

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const checkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      console.error("Auth Error: User not authenticated");
      res.sendStatus(401);
      return;
    }

    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET!
    ) as JwtPayload;
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.error("Auth Error: User not found");
      res.sendStatus(404);
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const adminRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user && req.user.role === "ADMIN") {
      next();
    } else {
      throw new AppError("Access denied - admin only", 403);
    }
  } catch (error) {
    next(error);
  }
};
