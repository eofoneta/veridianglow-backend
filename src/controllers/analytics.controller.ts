import { NextFunction, Request, Response } from "express";
import { getAnalyticsData, getDailySalesData } from "../utils/analytics.util";

export const getAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDateValue }: { startDateValue: number } = req.body;
    const analyticsData = await getAnalyticsData(next);
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - startDateValue);
    const dailySalesData = await getDailySalesData(startDate, endDate, next);

    res.json({
      success: true,
      analyticsData,
      dailySalesData,
    });
  } catch (error) {
    next(error);
  }
};
