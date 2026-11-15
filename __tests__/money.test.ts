import { formatAmount, formatCurrency } from '@/src/utils/money';

describe('money formatting', () => {
  it('groups thousands and keeps two decimals', () => {
    expect(formatAmount(0)).toBe('0.00');
    expect(formatAmount(1248.5)).toBe('1,248.50');
    expect(formatAmount(1234567.891)).toBe('1,234,567.89');
  });

  it('keeps the sign in front of the grouped figure', () => {
    expect(formatAmount(-1500)).toBe('-1,500.00');
  });

  it('prefixes the cedi symbol', () => {
    expect(formatCurrency(18)).toBe('GH₵ 18.00');
    expect(formatCurrency(2500)).toBe('GH₵ 2,500.00');
  });
});
