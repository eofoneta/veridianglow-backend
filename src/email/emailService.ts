import { IOrder } from "../models/order.model";
import { formatCurrency } from "../utils/helper";
import { PaystackEvent } from "../utils/payment.util";
import { sendEmail } from "./brevo";
import {
  DELIVERED_ORDER_TEMPLATE,
  ORDER_CONFIRMED_TEMPLATE,
  ORDER_SHIPPED_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
} from "./emailTemplates";
import dotenv from "dotenv";
dotenv.config();

export const sendVerificationEmail = async (
  email: string,
  verificationToken: string
) => {
  const recipients = [{ email }];

  const emailContent = {
    to: recipients,
    subject: "Verify your email",
    htmlContent: VERIFICATION_EMAIL_TEMPLATE.replace(
      "{verificationCode}",
      verificationToken
    ),
    category: "Reset your password",
  };

  sendEmail(
    email,
    emailContent.subject,
    emailContent.htmlContent,
    emailContent.category
  );
};

export const sendResetPasswordEmail = async (
  email: string,
  resetToken: string
) => {
  const recipients = [{ email }];

  const emailContent = {
    to: recipients,
    subject: "Reset Your password",
    html: PASSWORD_RESET_REQUEST_TEMPLATE.replace(
      "{resetURL}",
      `${process.env.FRONTEND_DOMAIN}/reset-password/${resetToken}`
    ),
    category: "Reset your password",
  };

  sendEmail(
    email,
    emailContent.subject,
    emailContent.html,
    emailContent.category
  );
};

export const sendResetSuccessEmail = async (email: string) => {
  const recipients = [{ email }];

  const emailContent = {
    to: recipients,
    subject: "Password reset success",
    html: PASSWORD_RESET_SUCCESS_TEMPLATE,
    category: "Password reset success",
  };

  sendEmail(
    email,
    emailContent.subject,
    emailContent.html,
    emailContent.category
  );
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
    "{deliveryAddress}":
      `${event.data.metadata.location.street},
       ${event.data.metadata.location.city},
        ${event.data.metadata.location.state},
        ${event.data.metadata.location.zipCode},
        ${event.data.metadata.location.country}` || "N/A",
    "{deliveryFee}": `${
      formatCurrency(event.data.metadata.deliveryFee) || "N/A"
    }`,
    "{totalAmount}": `${formatCurrency(event.data.amount / 100)}`,
    "{items}": event.data.metadata.products
      ? event.data.metadata.products
          .map(
            (item) =>
              `<tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price)}</td>
              </tr>`
          )
          .join("")
      : "<tr><td colspan='3'>No items found</td></tr>",
  };

  const emailHtml = ORDER_CONFIRMED_TEMPLATE.replace(
    /({\w+})/gi,
    (match) => orderDetails[match] || match
  );

  const emailContent = {
    to: [{ email }],
    subject: "Order confirmed",
    html: emailHtml,
    category: "Order confirmed",
  };

  sendEmail(
    email,
    emailContent.subject,
    emailContent.html,
    emailContent.category
  );
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
    "{deliveryAddress}":
      `${order.deliveryLocation.street},
      ${order.deliveryLocation.city},
      ${order.deliveryLocation.state},
      ${order.deliveryLocation.zipCode},
      ${order.deliveryLocation.country}` || "N/A",
    "{items}": order.products
      ? order.products
          .map(
            (item) =>
              `<tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price)}</td>
              </tr>`
          )
          .join("")
      : "<tr><td colspan='3'>No items found</td></tr>",
  };

  const emailHtml = ORDER_SHIPPED_TEMPLATE.replace(
    /({\w+})/gi,
    (match) => orderDetails[match] || match
  );

  const emailContent = {
    to: [{ email }],
    subject: "Order Shipped",
    html: emailHtml,
    category: "Order Shipped",
  };

  sendEmail(
    email,
    emailContent.subject,
    emailContent.html,
    emailContent.category
  );
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

  const emailContent = {
    to: [{ email }],
    subject: "Order Delivered",
    html: emailHtml,
    category: "Order Delivered",
  };

  sendEmail(
    email,
    emailContent.subject,
    emailContent.html,
    emailContent.category
  );
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
