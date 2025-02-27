import { NextFunction, Request, Response } from "express";
import { getAnalyticsData, getDailySalesData } from "../utils/analytics.util";

export const getAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let { startDateValue }: { startDateValue?: number } = req.body;

    if (!startDateValue || isNaN(startDateValue)) {
      startDateValue = 30 * 24 * 60 * 60 * 1000;
    }

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setTime(endDate.getTime() - startDateValue);

    const analyticsData = await getAnalyticsData(next);
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
