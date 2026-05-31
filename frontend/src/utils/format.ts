export const formatCurrency = (amount: number): string => {
  const currencyCode = localStorage.getItem('currency') || 'LKR';
  return new Intl.NumberFormat('en-US', { // Using en-US to avoid specific LKR formatting quirks when switching to USD/EUR
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};
