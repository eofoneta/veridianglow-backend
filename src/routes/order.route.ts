import express from "express";
import { adminRoute, protectedRoute } from "../middlewares/auth.middleware";
import {
  fetchCustomerFailedOrders,
  fetchCustomerPaidOrders,
  fetchOrderByStatus,
  updateDeliveryStatus,
} from "../controllers/order.controller";

export const orderRoute = express.Router();

orderRoute.patch(
  "/update_status/:orderId",
  protectedRoute,
  adminRoute,
  updateDeliveryStatus
);
orderRoute.post("/status", protectedRoute, adminRoute, fetchOrderByStatus);
orderRoute.get(
  "/customer_paid_orders",
  protectedRoute,
  fetchCustomerPaidOrders
);
orderRoute.get(
  "/customer_failed_orders",
  protectedRoute,
  fetchCustomerFailedOrders
);
