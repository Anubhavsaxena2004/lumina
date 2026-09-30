/**
 * Indian Formatting Utilities for Kumkum Payal
 * Complies with Indian Currency (Lakh/Crore grouping), 3-decimal Kg weight, and dd/mm/yyyy formatting.
 */

/**
 * Format currency in Indian Rupees (₹) with proper lakh and crore groupings.
 * Example: 1234567.5 -> "₹12,34,567.50"
 */
export function formatRupee(amount: number | string | null | undefined, showDecimals: boolean = true): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return showDecimals ? '₹0.00' : '₹0';
  }

  const num = Number(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const parts = absNum.toFixed(showDecimals ? 2 : 0).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian number grouping: last 3 digits, then groups of 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);

  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const result = showDecimals && decimalPart !== undefined
    ? `₹${formattedInteger}.${decimalPart}`
    : `₹${formattedInteger}`;

  return isNegative ? `-${result}` : result;
}

/**
 * Format weight in Kilograms (Kg) strictly to 3 decimal places.
 * Example: 1.25 -> "1.250 Kg"
 */
export function formatWeightKg(weightKg: number | string | null | undefined): string {
  if (weightKg === null || weightKg === undefined || isNaN(Number(weightKg))) {
    return '0.000 Kg';
  }

  const num = Number(weightKg);
  return `${num.toFixed(3)} Kg`;
}

/**
 * Format date string or Date object to Indian format: dd/mm/yyyy
 * Example: "2026-10-01T04:15:00Z" -> "01/10/2026"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
}

/**
 * Format date and time string or Date object to: dd/mm/yyyy, hh:mm a
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';

    const dateFormatted = formatDate(d);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour should be 12
    const strHours = String(hours).padStart(2, '0');

    return `${dateFormatted}, ${strHours}:${minutes} ${ampm}`;
  } catch {
    return '-';
  }
}

/**
 * Parses user input currency string to float number safely
 */
export function parseRupeeToNumber(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  const clean = value.toString().replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parses user input weight to 3-decimal float number safely
 */
export function parseWeightToNumber(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : Math.round(value * 1000) / 1000;
  if (!value) return 0;
  const clean = value.toString().replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : Math.round(parsed * 1000) / 1000;
}
