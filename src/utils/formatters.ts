export const formatCurrency = (val: number, includeSign = false): string => {
  const sign = includeSign && val > 0 ? '+' : '';
  return `${sign}$${Math.abs(val).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatSignedCurrency = (val: number): string => {
  if (val > 0) return `+$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (val < 0) return `-$${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$0.00`;
};

export const formatPercent = (val: number, includeSign = true): string => {
  const sign = includeSign && val > 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
};

export const formatPips = (val: number): string => {
  return `${val.toFixed(1)} pips`;
};

export const formatPrice = (val: number, decimals = 5): string => {
  if (!val) return '0.00';
  // Adjust decimal precision for Gold/Indices vs Forex
  if (val > 500) {
    return val.toFixed(2);
  }
  return val.toFixed(decimals);
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const getDaysInMonth = (year: number, monthIndex: number): number => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, monthIndex: number): number => {
  return new Date(year, monthIndex, 1).getDay();
};

export const formatDateString = (year: number, monthIndex: number, day: number): string => {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

export const parseDateString = (dateStr: string): { year: number; month: number; day: number } => {
  const parts = dateStr.split('-');
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10) - 1,
    day: parseInt(parts[2], 10)
  };
};
