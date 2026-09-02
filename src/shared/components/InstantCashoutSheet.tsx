import { Zap } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { Button } from '@/src/shared/components/Button';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            paddingBottom: 36,
            gap: 16,
          }}
        >
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

          <Text className="text-caption" style={{ color: theme.textSecondary, textAlign: 'center' }}>
            Or skip the fee and get the full {formatCurrency(balance)} on your next scheduled payout,{' '}
            {nextPayoutLabel}.
          </Text>

          <Button title="Cash out now" variant="partner" fullWidth onPress={onConfirm} />
          <AnimatedPressable onPress={onClose} scaleTo={0.98} style={{ alignItems: 'center' }}>
            <Text className="text-body-lg font-medium" style={{ color: theme.textSecondary }}>
              Wait for scheduled payout
            </Text>
          </AnimatedPressable>
        </Pressable>
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
      <Text className={bold ? 'text-body-lg font-bold' : 'text-body font-medium'} style={{ color: muted ? theme.textSecondary : theme.text }}>
        {value}
      </Text>
    </View>
  );
}
