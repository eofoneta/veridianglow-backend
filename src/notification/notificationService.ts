import notificationEmitter from "./notificationEvents";
import Notification, { NotificationType } from "../models/notification.models";
import { Types } from "mongoose";

const createNotification = async (
  userId: Types.ObjectId,
  message: string,
  notificationType: NotificationType
) => {
  const notification = await Notification.create({
    userId,
    message,
    notificationType,
  });

  notificationEmitter.emit("newNotification", {
    userId,
    message,
    notificationType,
  });

  return notification;
};

export default createNotification;
