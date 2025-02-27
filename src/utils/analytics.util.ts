import { NextFunction } from "express";
import User from "../models/users.model";
import Product from "../models/product.model";
import Order from "../models/order.model";

type SalesData = {
  totalSales: number;
  totalRevenue: number;
};

type dailySalesData = {
  _id: string;
  sales: number;
  revenue: number;
};

export const getAnalyticsData = async (next: NextFunction) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalSuccessfullDeliveries = await Order.countDocuments({
      status: "DELIVERED",
    });
    const totalPaidOrders = await Order.countDocuments({
      paid: true,
    });

    const salesData: SalesData[] = await Order.aggregate([
      {
        $match: { paid: true },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const { totalSales, totalRevenue } = salesData[0] || {
      totalSales: 0,
      totalRevenue: 0,
    };

    return {
      totalUsers,
      totalPaidOrders,
      totalProducts,
      totalOrders,
      totalSuccessfullDeliveries,
      totalSales,
      totalRevenue,
    };
  } catch (error) {
    next(error);
  }
};

export const getDailySalesData = async (
  startDate: Date,
  endDate: Date,
  next: NextFunction
) => {
  try {
    const dailySalesData: dailySalesData[] = await Order.aggregate([
      {
        $match: {
          paid: true,
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dateArray = getDateInrange(startDate, endDate, next);

    return dateArray?.map((date) => {
      const foundData = dailySalesData.find((item) => item._id === date);
      return {
        sales: foundData?.sales || 0.0,
        revenue: foundData?.revenue.toFixed(2) || 0.0,
      };
    });
  } catch (error) {
    next(error);
  }
};

const getDateInrange = (startDate: Date, endDate: Date, next: NextFunction) => {
  try {
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      throw new Error("Invalid startDate");
    }
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new Error("Invalid endDate");
    }

    const dates = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  } catch (error) {
    next(error);
  }
};
