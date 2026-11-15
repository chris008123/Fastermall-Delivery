import { Text, type TextProps } from 'react-native';
import { typography } from '@/src/theme';
import { CURRENCY_SYMBOL, formatAmount } from '@/src/utils/money';

type MoneySize = keyof typeof typography.money;

interface MoneyTextProps extends Omit<TextProps, 'children'> {
  amount: number;
  size?: MoneySize;
  color: string;
  /** Prefix such as "+" or "− " for ledger rows and deductions. */
  sign?: string;
}

/**
 * An amount of money in the app's money font. On the larger sizes the
 * "GH₵" sits a step smaller than the number, so the figure is what the eye
 * lands on. Figures are tabular, so columns of amounts line up and a
 * changing balance doesn't shift sideways.
 */
export function MoneyText({ amount, size = 'body', color, sign = '', style, ...rest }: MoneyTextProps) {
  const t = typography.money[size];
  const large = size === 'display' || size === 'h1';
  return (
    <Text
      accessibilityLabel={`${sign.trim() === '+' ? 'plus ' : sign.trim() ? 'minus ' : ''}${formatAmount(amount)} Ghana cedis`}
      style={[t, { color, fontVariant: ['tabular-nums'] }, style]}
      {...rest}
    >
      {sign}
      <Text style={large ? { fontSize: Math.round(t.fontSize * 0.6), letterSpacing: 0 } : undefined}>
        {CURRENCY_SYMBOL}
      </Text>
      {' '}
      {formatAmount(amount)}
    </Text>
  );
}
