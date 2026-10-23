import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import { PayoutDestinationForm } from '@/src/shared/components/PayoutDestinationForm';
import { maskMomoNumber, usePayoutStore } from '@/src/stores/payoutStore';
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

/** Confirms an instant cash-out: what you have, what the fee takes, what
 * lands in your account and where it's going, with the free scheduled
 * payout offered as the alternative so paying the fee is always a choice. */
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

  const savedNumber = usePayoutStore((s) => s.number);
  const savedNetwork = usePayoutStore((s) => s.network);
  const setDestination = usePayoutStore((s) => s.setDestination);

  const [editing, setEditing] = useState(!savedNumber);
  const [feeInfoOpen, setFeeInfoOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setEditing(!savedNumber);
      setFeeInfoOpen(false);
    }
    // Only reset when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const canConfirm = !!savedNumber && !editing;

  return (
    <Sheet visible={visible} onClose={onClose} title="Cash out instantly?">
      <View style={{ gap: 16, paddingTop: 4 }}>
        <View style={{ gap: 10 }}>
          <Row label="Available balance" value={formatCurrency(balance)} />
          <Row label="Instant transfer fee" value={`− ${formatCurrency(feeAmount)}`} muted />
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.lineStrong, marginVertical: 2 }} />
          <Row label="You'll receive now" value={formatCurrency(net)} strong />
        </View>

        <Pressable
          onPress={() => setFeeInfoOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: feeInfoOpen }}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32, alignSelf: 'flex-start' }}
        >
          <Txt variant="label" tone="primary">
            Why is there a fee?
          </Txt>
          {feeInfoOpen ? <ChevronUp size={16} color={t.primary} /> : <ChevronDown size={16} color={t.primary} />}
        </Pressable>
        {feeInfoOpen ? (
          <Txt variant="caption" tone="secondary" style={{ marginTop: -8 }}>
            Instant transfers use mobile money's fast lane, which carries a small fee. Your scheduled payout goes out
            in a regular batch, so it's free. You'd get the full {formatCurrency(balance)} on {nextPayoutLabel}.
          </Txt>
        ) : null}

        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.line }} />

        {editing ? (
          <View style={{ gap: 10 }}>
            <Txt variant="heading">{savedNumber ? 'Change where it goes' : 'Where should we send it?'}</Txt>
            <PayoutDestinationForm
              key={`${savedNumber ?? ''}-${savedNetwork}`}
              initialNumber={savedNumber}
              initialNetwork={savedNetwork}
              onSave={(network, number) => {
                setDestination(network, number);
                setEditing(false);
              }}
              onCancel={savedNumber ? () => setEditing(false) : undefined}
            />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Txt variant="caption" tone="secondary">
                Sending to
              </Txt>
              <Txt variant="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>
                {savedNetwork} · {savedNumber ? maskMomoNumber(savedNumber) : ''}
              </Txt>
            </View>
            <Pressable onPress={() => setEditing(true)} accessibilityRole="button" hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
              <Txt variant="label" tone="primary">
                Change
              </Txt>
            </Pressable>
          </View>
        )}

        <View style={{ gap: 8 }}>
          <Button title="Cash out now" size="lg" fullWidth disabled={!canConfirm} onPress={onConfirm} />
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
