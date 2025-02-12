import { AppError } from "../error/GlobalErrorHandler";
import { IOrder } from "../models/order.model";
import { PaystackEvent } from "../utils/payment.util";
import {
  DELIVERED_ORDER_TEMPLATE,
  ORDER_CONFIRMED_TEMPLATE,
  ORDER_SHIPPED_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
} from "./emailTemplates";
import { mailtrapClient, sender } from "./mailtrap";
import dotenv from "dotenv";
dotenv.config();

export const sendVerificationEmail = async (
  email: string,
  verificationToken: string
) => {
  const recipients = [{ email }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipients,
      subject: "Verify your email",
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        "{verificationCode}",
        verificationToken
      ),
      category: "Email verification",
    });
    console.log("email sent successfully", response);
  } catch (error) {
    console.error("Error sending email", error);
    throw new AppError("Error sending email", 500);
  }
};

export const sendResetPasswordEmail = async (
  email: string,
  resetToken: string
) => {
  const recipients = [{ email }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipients,
      subject: "Reset Your password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace(
        "{resetURL}",
        `${process.env.FRONTEND_DOMAIN}/reset-password/${resetToken}`
      ),
      category: "Reset your password",
    });
    console.log("email sent successfully", response);
  } catch (error) {
    console.error("Error sending email", error);
    throw new AppError("Error sending email", 500);
  }
};

export const sendResetSuccessEmail = async (email: string) => {
  const recipients = [{ email }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipients,
      subject: "Password reset success",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
      category: "Password reset success",
    });
    console.log("email sent successfully", response);
  } catch (error) {
    console.error("Error sending email", error);
    throw new Error(`Error sending email ${error}`);
  }
};

export const sendOrderReceivedEmail = async (
  email: string,
  event: PaystackEvent
): Promise<void> => {
  const orderDetails: Record<string, any> = {
    "{orderNumber}": event.data.metadata.orderId || "N/A",
    "{date}": formatDate(event.data.paid_at) || "N/A",
    "{customerName}":
      capitalize(event.data.metadata.firstName) || "Valued Customer",
    "{estimatedDeliveryDate}":
      formatDate(event.data.metadata.estimatedDeliveryDate) || "N/A",
    "{deliveryAddress}": event.data.metadata.location || "N/A",
    "{deliveryFee}": `$${event.data.metadata.deliveryFee || "0.00"}`,
    "{discount}": `$${event.data.metadata.discount || "0.00"}`,
    "{totalAmount}": `$${event.data.amount / 100}`,
    "{items}": event.data.metadata.products
      ? event.data.metadata.products
          .map(
            (item) =>
              `<tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>$${item.price}</td>
              </tr>`
          )
          .join("")
      : "<tr><td colspan='3'>No items found</td></tr>",
  };

  const emailHtml = ORDER_CONFIRMED_TEMPLATE.replace(
    /({\w+})/gi,
    (match) => orderDetails[match] || match
  );

  await mailtrapClient.send({
    from: sender,
    to: [{ email }],
    subject: "Order confirmed",
    html: emailHtml,
    category: "Order confirmed",
  });
};

export const sendOrderShipped = async (
  email: string,
  order: IOrder
): Promise<void> => {
  const orderDetails: Record<string, any> = {
    "{orderNumber}": order.id || "N/A",
    "{estimatedDeliveryDate}": formatDate(order.estimatedDeliveryDate) || "N/A",
    "{shipmentDate}": formatDate(order.updatedAt) || "N/A",
    "{frontendUrl}": `${process.env.FRONTEND_DOMAIN}/order`,
    "{deliveryAddress}": order.deliveryLocation || "N/A",
    "{items}": order.products
      ? order.products
          .map(
            (item) =>
              `<tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>₦${item.price}</td>
              </tr>`
          )
          .join("")
      : "<tr><td colspan='3'>No items found</td></tr>",
  };

  const emailHtml = ORDER_SHIPPED_TEMPLATE.replace(
    /({\w+})/gi,
    (match) => orderDetails[match] || match
  );

  await mailtrapClient.send({
    from: sender,
    to: [{ email }],
    subject: "Order shipped",
    html: emailHtml,
    category: "Order shipped",
  });
};

export const sendOrderDelivered = async (email: string, order: IOrder) => {
  const orderDetails: Record<string, any> = {
    "{orderNumber}": order.id || "N/A",
    "{deliveryDate}": formatDate(order.updatedAt) || "N/A",
    "{frontendUrl}": `${process.env.FRONTEND_DOMAIN}/order`,
  };

  const emailHtml = DELIVERED_ORDER_TEMPLATE.replace(
    /({\w+})/gi,
    (match) => orderDetails[match] || match
  );

  await mailtrapClient.send({
    from: sender,
    to: [{ email }],
    subject: "Order delivered",
    html: emailHtml,
    category: "Order delivered",
  });
};

const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const formatDate = (dateString: Date) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
};
