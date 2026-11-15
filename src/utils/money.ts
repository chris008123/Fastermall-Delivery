const CURRENCY = 'GH₵';

/** "1248.5" → "1,248.50". Hand-rolled rather than Intl so it's the same on
 * every Android build, whatever locale data Hermes ships with. */
export function formatAmount(amount: number) {
  const fixed = Math.abs(amount).toFixed(2);
  const [whole, cents] = fixed.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${amount < 0 ? '-' : ''}${grouped}.${cents}`;
}

export function formatCurrency(amount: number) {
  return `${CURRENCY} ${formatAmount(amount)}`;
}

export const CURRENCY_SYMBOL = CURRENCY;
