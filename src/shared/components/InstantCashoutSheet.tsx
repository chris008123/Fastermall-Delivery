import { ChevronDown, ChevronUp, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { Button } from '@/src/shared/components/Button';
import { PayoutDestinationForm } from '@/src/shared/components/PayoutDestinationForm';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { maskMomoNumber, usePayoutStore } from '@/src/stores/payoutStore';
import { colors } from '@/src/theme';
import { formatCurrency } from '@/src/utils/money';

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
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              maxHeight: '92%',
              backgroundColor: theme.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingTop: 24,
              paddingHorizontal: 24,
              paddingBottom: 36,
            }}
          >
            <ScrollView bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16 }}>
              <View style={{ alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.partner.orangeTint,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Zap size={26} color={colors.partner.orange} />
                </View>
                <Text className="text-h1 font-bold" style={{ color: theme.text }}>Cash out instantly?</Text>
              </View>

              <View style={{ gap: 10 }}>
                <SheetRow label="Available balance" value={formatCurrency(balance)} theme={theme} />
                <SheetRow label="Instant transfer fee" value={`− ${formatCurrency(feeAmount)}`} theme={theme} muted />
                <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 2 }} />
                <SheetRow label="You'll receive now" value={formatCurrency(net)} theme={theme} bold />
              </View>

              <AnimatedPressable
                onPress={() => setFeeInfoOpen((v) => !v)}
                scaleTo={0.98}
                accessibilityRole="button"
                accessibilityState={{ expanded: feeInfoOpen }}
                style={{ alignSelf: 'flex-start' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text className="text-caption font-semibold" style={{ color: colors.partner.orange }}>
                    Why is there a fee?
                  </Text>
                  {feeInfoOpen ? (
                    <ChevronUp size={14} color={colors.partner.orange} />
                  ) : (
                    <ChevronDown size={14} color={colors.partner.orange} />
                  )}
                </View>
              </AnimatedPressable>
              {feeInfoOpen ? (
                <Text className="text-caption" style={{ color: theme.textSecondary, marginTop: -8 }}>
                  Instant transfers use mobile money's fast lane, which carries a small fee. Your scheduled payout goes
                  out in a regular batch, so it's free. You'd get the full {formatCurrency(balance)} on{' '}
                  {nextPayoutLabel}.
                </Text>
              ) : null}

              <View style={{ height: 1, backgroundColor: theme.border }} />

              {editing ? (
                <View style={{ gap: 12 }}>
                  <Text className="text-card-title font-semibold" style={{ color: theme.text }}>
                    {savedNumber ? 'Change where it goes' : 'Where should we send it?'}
                  </Text>
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
                    <Text className="text-caption" style={{ color: theme.textSecondary }}>Sending to</Text>
                    <Text className="text-body-lg font-semibold" style={{ color: theme.text, fontVariant: ['tabular-nums'] }}>
                      {savedNetwork} · {savedNumber ? maskMomoNumber(savedNumber) : ''}
                    </Text>
                  </View>
                  <AnimatedPressable onPress={() => setEditing(true)} scaleTo={0.97} accessibilityRole="button" hitSlop={10}>
                    <Text className="text-caption font-semibold" style={{ color: colors.partner.orange }}>Change</Text>
                  </AnimatedPressable>
                </View>
              )}

              <Button title="Cash out now" variant="partner" fullWidth disabled={!canConfirm} onPress={onConfirm} />
              <AnimatedPressable onPress={onClose} scaleTo={0.98} style={{ alignItems: 'center' }}>
                <Text className="text-body-lg font-medium" style={{ color: theme.textSecondary }}>
                  Wait for scheduled payout
                </Text>
              </AnimatedPressable>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

function SheetRow({
  label,
  value,
  theme,
  bold,
  muted,
}: {
  label: string;
  value: string;
  theme: { text: string; textSecondary: string };
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text className={bold ? 'text-body-lg font-bold' : 'text-body'} style={{ color: muted ? theme.textSecondary : theme.text }}>
        {label}
      </Text>
      <Text className={bold ? 'text-body-lg font-bold' : 'text-body font-medium'} style={{ color: muted ? theme.textSecondary : theme.text, fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
    </View>
  );
}
