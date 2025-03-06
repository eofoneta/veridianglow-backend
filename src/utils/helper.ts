export const formatCurrency = (amount: number | undefined) => {
  return `₦${(amount ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
};
