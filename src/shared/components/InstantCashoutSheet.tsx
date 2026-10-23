import { StyleSheet, View } from 'react-native';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import { formatCurrency } from '@/src/utils/money';
import { Button } from '@/src/ui/Button';
import { Sheet } from '@/src/ui/Sheet';

interface InstantCashoutSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  balance: number;
  feeAmount: number;
  nextPayoutLabel: string;
}

/** Confirms an instant cash-out: what you have, what the fee takes, and
 * what lands in your account, with the free scheduled payout offered as
 * the alternative so paying the fee is always a choice. */
export function InstantCashoutSheet({
  visible,
  onClose,
  onConfirm,
  balance,
  feeAmount,
  nextPayoutLabel,
}: InstantCashoutSheetProps) {
  const { t } = useTheme();
  const net = Math.max(balance - feeAmount, 0);

  return (
    <Sheet visible={visible} onClose={onClose} title="Cash out instantly?">
      <View style={{ gap: 16, paddingTop: 4 }}>
        <View style={{ gap: 10 }}>
          <Row label="Available balance" value={formatCurrency(balance)} />
          <Row label="Instant transfer fee" value={`− ${formatCurrency(feeAmount)}`} muted />
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.lineStrong, marginVertical: 2 }} />
          <Row label="You'll receive now" value={formatCurrency(net)} strong />
        </View>

        <Txt variant="caption" tone="secondary">
          Or skip the fee and get the full {formatCurrency(balance)} on your next scheduled payout, {nextPayoutLabel}.
        </Txt>

        <View style={{ gap: 8 }}>
          <Button title="Cash out now" size="lg" fullWidth onPress={onConfirm} />
          <Button title="Wait for scheduled payout" variant="quiet" fullWidth onPress={onClose} />
        </View>
      </View>
    </Sheet>
  );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
      <Txt variant={strong ? 'heading' : 'body'} tone={muted ? 'secondary' : 'ink'}>
        {label}
      </Txt>
      <Txt variant={strong ? 'heading' : 'bodyStrong'} tone={muted ? 'secondary' : 'ink'} style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Txt>
    </View>
  );
}
