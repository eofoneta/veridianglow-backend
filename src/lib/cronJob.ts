import cron from "node-cron";
import Order from "../models/order.model";

const ABANDONMENT_TIME = 24 * 60 * 60 * 1000; // 24 hrs

// Schedule a job to run every 5 minutes
cron.schedule("0 * * * *", async () => {
  try {
    console.log("🔍 Checking for abandoned orders...");

    const twentyFourHoursAgo = new Date(Date.now() - ABANDONMENT_TIME);

    const expiredOrders = await Order.find({
      status: "PENDING",
      paid: false,
      createdAt: { $lt: twentyFourHoursAgo },
    });

    if (expiredOrders.length > 0) {
      console.log(`❌ Marking ${expiredOrders.length} orders as ABANDONED...`);
      await Order.updateMany(
        {
          status: "PENDING",
          paid: false,
          createdAt: { $lt: twentyFourHoursAgo },
        },
        {
          $set: { status: "ABANDONED" },
        }
      );

      console.log("✅ Abandoned orders updated successfully.");
    } else {
      console.log("✅ No abandoned orders found.");
    }
  } catch (error) {
    console.error("❌ Error updating abandoned orders:", error);
  }
});
