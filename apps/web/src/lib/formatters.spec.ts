import { describe, it, expect } from 'vitest';
import {
  formatRupee,
  formatWeightKg,
  formatDate,
  parseRupeeToNumber,
  parseWeightToNumber,
} from './formatters';

describe('formatRupee', () => {
  it('formats zero correctly', () => {
    expect(formatRupee(0)).toBe('₹0.00');
    expect(formatRupee(0, false)).toBe('₹0');
  });

  it('formats Indian lakh and crore groupings properly', () => {
    expect(formatRupee(1000)).toBe('₹1,000.00');
    expect(formatRupee(10000)).toBe('₹10,000.00');
    expect(formatRupee(100000)).toBe('₹1,00,000.00');
    expect(formatRupee(1234567.89)).toBe('₹12,34,567.89');
    expect(formatRupee(10000000)).toBe('₹1,00,00,000.00');
  });

  it('handles negative numbers properly', () => {
    expect(formatRupee(-50000)).toBe('-₹50,000.00');
  });

  it('handles null and undefined gracefully', () => {
    expect(formatRupee(null)).toBe('₹0.00');
    expect(formatRupee(undefined)).toBe('₹0.00');
  });
});

describe('formatWeightKg', () => {
  it('formats weight strictly with 3 decimals and Kg unit', () => {
    expect(formatWeightKg(1.25)).toBe('1.250 Kg');
    expect(formatWeightKg(0.005)).toBe('0.005 Kg');
    expect(formatWeightKg(10)).toBe('10.000 Kg');
    expect(formatWeightKg(2.3456)).toBe('2.346 Kg');
  });

  it('handles null/undefined gracefully', () => {
    expect(formatWeightKg(null)).toBe('0.000 Kg');
    expect(formatWeightKg(undefined)).toBe('0.000 Kg');
  });
});

describe('formatDate', () => {
  it('formats date to dd/mm/yyyy', () => {
    const testDate = new Date(2026, 9, 1); // 1st Oct 2026
    expect(formatDate(testDate)).toBe('01/10/2026');
  });

  it('handles invalid dates gracefully', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate('invalid-date')).toBe('-');
  });
});

describe('number parsers', () => {
  it('parses formatted rupee strings', () => {
    expect(parseRupeeToNumber('₹12,34,567.50')).toBe(1234567.5);
    expect(parseRupeeToNumber('50000')).toBe(50000);
  });

  it('parses weight strings', () => {
    expect(parseWeightToNumber('1.250 Kg')).toBe(1.25);
    expect(parseWeightToNumber('0.005')).toBe(0.005);
  });
});
