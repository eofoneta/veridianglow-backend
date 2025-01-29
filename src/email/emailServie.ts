import { AppError } from "../error/GlobalErrorHandler";
import {
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
