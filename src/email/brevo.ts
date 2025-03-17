import dotenv from "dotenv";
dotenv.config();

const BREVO_API_KEY = process.env.MAIL_API!;

const sender = {
  email: process.env.SENDER_EMAIL!,
  name: process.env.SENDER_NAME!,
};

export const sendEmail = async (
  email: string,
  subject: string,
  htmlContent: string,
  category: string
) => {
  const url = "https://api.brevo.com/v3/smtp/email";

  const payload = {
    sender,
    to: [{ email }],
    subject,
    htmlContent,
    headers: { "X-Mail-Category": category },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Email sent successfully to ${email}:`, data);
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    throw new Error("Error sending email");
  }
};
