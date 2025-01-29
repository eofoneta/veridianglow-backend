import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { connectDb } from "./lib/mongodb";
import { errorHandler } from "./error/GlobalErrorHandler";
import cookieParser from "cookie-parser";
import { authRoute } from "./routes/auth.route";
import { productRoute } from "./routes/product.route";

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/product", productRoute);

// Global error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next);
});

app.listen(port, () => {
  console.log("Server is running on port", port);
  connectDb();
});
