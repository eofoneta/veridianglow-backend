/**
 * This is just for testing, NOT to be used in production
 */
const fixedDeliveryFees: Record<string, number> = {
  lagos: 1000,
  abuja: 1500,
  port_harcourt: 1800,
  kano: 2000,
  others: 2500,
};

export const getDeliveryFee = (location: string): number => {
  const baseFee =
    fixedDeliveryFees[location.toLowerCase()] || fixedDeliveryFees["others"];
  return baseFee;
};

export const convertToNaira = (amount: number): string => {
  const nairaRate = amount * 100;
  return nairaRate.toString();
};

export const calculateTax = (subtotal: number): number => {
  const taxRate = 0.075; // 7.5% VAT FOR NIGERIA
  return subtotal * taxRate;
};

export const calculateTotal = (subtotal: number, location: string): number => {
  const deliveryFee = getDeliveryFee(location);
  const tax = calculateTax(subtotal);
  const totalAmount = subtotal + deliveryFee + tax;
  return totalAmount;
};
