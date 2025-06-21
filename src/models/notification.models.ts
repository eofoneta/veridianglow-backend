import mongoose, { Model, Schema } from "mongoose";

export interface INotificationSchema {
  message: string;
  userId: Schema.Types.ObjectId;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
  notificationType: NotificationType;
}

export enum NotificationType {
  ORDER_PLACED = "ORDER_PLACED",
  REMINDER = "REMINDER",
  LOW_STOCK = "LOW_STOCK",
}

const NotificationSchema = new mongoose.Schema<INotificationSchema>(
  {
    message: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    read: {
      type: Boolean,
      default: false,
    },
    notificationType: {
      type: String,
      enum: ["ORDER_PLACED", "REMINDER", "LOW_STOCK"],
    },
  },
  { timestamps: true }
);

const Notification: Model<INotificationSchema> = mongoose.model(
  "Notification",
  NotificationSchema
);

export default Notification;
