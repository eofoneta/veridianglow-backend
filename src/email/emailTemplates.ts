export const VERIFICATION_EMAIL_TEMPLATE = /*html*/ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #F872C4, #F37CC5); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Verify Your Email</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>Thank you for signing up! Your verification code is:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000000;">{verificationCode}</span>
    </div>
    <p>Enter this code on the verification page to complete your registration.</p>
    <p>This code will expire in 15 minutes.</p>
    <p>If you didn't create an account with us, please ignore this email.</p>
    <p>Best regards,<br>VeridianGlow team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export const PASSWORD_RESET_SUCCESS_TEMPLATE = /*html*/ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Successful</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #F872C4, #f37cc5); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Password Reset Successful</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>We're writing to confirm that your password has been successfully reset.</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="background-color: #4CAF50; color: white; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; display: inline-block; font-size: 30px;">
        ✓
      </div>
    </div>
    <p>If you did not initiate this password reset, please contact our support team immediately.</p>
    <p>For security reasons, we recommend that you:</p>
    <ul>
      <li>Use a strong, unique password</li>
      <li>Avoid using the same password across multiple sites</li>
    </ul>
    <p>Thank you for helping us keep your account secure.</p>
    <p>Best regards,<br>Veridianglow Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export const PASSWORD_RESET_REQUEST_TEMPLATE = /*html*/ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #F872C4, #f77dc8); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Password Reset</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
    <p>To reset your password, click the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{resetURL}" style="background-color: #F872C4; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
    </div>
    <p>This link will expire in 1 hour for security reasons.</p>
    <p>Best regards,<br>VeridianGlow team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export const ORDER_CONFIRMED_TEMPLATE = /*html */ `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payment Receipt</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f8f8f8;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background: #fff;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        padding: 20px 0;
      }
      .header h1 {
        margin: 0;
        color: #F872C4;
      }
      .receipt-info {
        margin: 20px 0;
      }
      .receipt-info p {
        margin: 5px 0;
        font-size: 16px;
      }
      .table-container {
        width: 100%;
        border-collapse: collapse;
      }
      .table-container th,
      .table-container td {
        border: 1px solid #ddd;
        padding: 10px;
        text-align: left;
      }
      .table-container th {
        background: #F872C4;
        color: #fff;
      }
      .total {
        text-align: right;
        font-weight: bold;
        margin-top: 10px;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        font-size: 14px;
        color: #777;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Veridianglow</h1>
        <span class="byveekee">byVeekee</span>
        <p>
          Dear<strong> {customerName}</strong>, your order <strong> {orderNumber}</strong> has been
          confirmed successfully. It will be packed and shipped as soon as
          possible.You will receive an update from us once the item(s) are ready
          for delivery.
        </p>
      </div>
      <div class="receipt-info">
        <p><strong>Date:</strong> {date}</p>
      </div>
      <table class="table-container">
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Price</th>
        </tr>
        {items} <!-- This will be replaced with actual rows -->
        <tr>
          <td><strong>estimated delivery date</strong></td>
          <td colspan="2" class="total">{estimatedDeliveryDate}</td>
        </tr>
        <tr>
          <td><strong>delivery address</strong></td>
          <td colspan="2" class="total">{deliveryAddress}</td>
        </tr>
        <tr>
          <td><strong>Delivery</strong></td>
          <td colspan="2" class="total">{deliveryFee}</td>
        </tr>
        <tr>
          <td><strong>discount</strong></td>
          <td colspan="2" class="total">{discount}</td>
        </tr>
        <tr>
          <td><strong>Total</strong></td>
          <td colspan="2" class="total">{totalAmount}</td>
        </tr>
      </table>
      <div class="footer">
        <p>Thank you for shopping with us!</p>
        <p>For inquiries, contact veriadianglow@Veridianglow.com</p>
      </div>
    </div>
  </body>
</html>
`;

export const ORDER_SHIPPED_TEMPLATE = /*html */ `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Order Shipped</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f8f8f8;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background: #fff;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        padding: 20px 0;
      }
      .header h1 {
        margin: 0;
        color: #f872c4;
      }
      .order-info {
        margin: 20px 0;
      }
      .order-info p {
        margin: 5px 0;
        font-size: 16px;
      }
      .table-container {
        width: 100%;
        border-collapse: collapse;
      }
      .table-container th,
      .table-container td {
        border: 1px solid #ddd;
        padding: 10px;
        text-align: left;
      }
      .table-container th {
        background: #f872c4;
        color: #fff;
      }
      .total {
        text-align: right;
        font-weight: bold;
        margin-top: 10px;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        font-size: 14px;
        color: #777;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Veridianglow</h1>
        <p>Your order is on the way!</p>
        <p>
          We thought you'd like to know that your Item(s) from your order
          <strong> {orderNumber}</strong>
          has been shipped and is on the way to your location. You can review
          your package status at any time by visiting your order status page on
           our website or click  <a href="{trackOrder}">here</a>.
        </p>
      </div>
      <div class="order-info">
        <p><strong>Order No:</strong> #{orderNumber}</p>
        <p><strong>Shipment Date:</strong> {shipmentDate}</p>
      </div>
      <table class="table-container">
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Price</th>
        </tr>
        {items}
        <tr>
          <td><strong>delivery address</strong></td>
          <td colspan="2" class="total">{deliveryAddress}</td>
      </tr>
        <tr>
          <td><strong>estimated delivery date</strong></td>
          <td colspan="2" class="total">{estimatedDeliveryDate}</td>
        </tr>
      </table>
      <div class="footer">
        <p>Thank you for shopping with VeridianGlow!</p>
        <p>For inquiries, contact support@VeridianGlow.com</p>
      </div>
    </div>
  </body>
</html>

`;
// TODO - Formart dates 