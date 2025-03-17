import Brevo from "@getbrevo/brevo";
import dotenv from "dotenv";
dotenv.config();

export const brevoClient = new Brevo.TransactionalEmailsApi();
brevoClient.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.MAIL_API
);

export const sender = {
  email: process.env.SENDER_EMAIL,
  name: process.env.SENDER_NAME,
};

const sendEmail = async (email, subject, htmlContent, category) => {
  try {
    const response = await brevoClient.sendTransacEmail({
      sender,
      to: [{ email }],
      subject,
      htmlContent,
      headers: { "X-Mail-Category": category },
    });
    console.log(`Email sent successfully to ${email}:`, response);
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    throw new Error("Error sending email", 500);
  }
};

sendEmail(
  "emmanuelofoneta@gmail.com",
  "test email",
  "Hello I'm using brevo!",
  "test"
);
