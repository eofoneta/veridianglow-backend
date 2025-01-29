import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error: ", err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }
  if (err instanceof JsonWebTokenError) {
    return res.status(401).json({ message: "Invalid access token" });
  }
  if (err instanceof TokenExpiredError) {
    return res.status(401).json({ message: "Access token expired" });
  }

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error occured",
  });
};
