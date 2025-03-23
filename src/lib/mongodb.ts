import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const MONGODB_URL = process.env.MONGODB_URL;
const MONGODB_NAME = process.env.MONGODB_NAME;

export const connectDb = () => {
  mongoose
    .connect(`${MONGODB_URL}`)
    .then(() => {
      console.log("Connected to", MONGODB_NAME, "database");
    })
    .catch((error) => {
      console.log("Error connecting to the database", error.message);
      process.exit(1);
    });
};
