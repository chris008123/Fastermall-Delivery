import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { BackButton } from '@/src/shared/components/BackButton';
import { Button } from '@/src/shared/components/Button';
import { GlassView } from '@/src/shared/components/GlassView';
import { PayoutDestinationForm } from '@/src/shared/components/PayoutDestinationForm';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useToast } from '@/src/shared/toast/ToastProvider';
import { maskMomoNumber, usePayoutStore } from '@/src/stores/payoutStore';
import { colors } from '@/src/theme';

// Where instant cash-outs are sent. Kept on this device for now (see
// payoutStore); the Wallet's cash-out sheet reads the same saved number.
export default function PayoutDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const { show } = useToast();

  const number = usePayoutStore((s) => s.number);
  const network = usePayoutStore((s) => s.network);
  const setDestination = usePayoutStore((s) => s.setDestination);
  const clearDestination = usePayoutStore((s) => s.clearDestination);
  const [editing, setEditing] = useState(false);

  const confirmRemove = () => {
    Alert.alert(
      'Remove this number?',
      "You'll need to add a number again before your next instant cash-out. Scheduled payouts aren't affected.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            clearDestination();
            show('Number removed', 'info');
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: insets.bottom + 48, gap: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>Payout details</Text>
      </View>

      {editing || !number ? (
        <GlassView radius="card" style={{ padding: 18, gap: 14 }}>
          <Text className="text-card-title font-semibold" style={{ color: theme.text }}>
            {number ? 'Change your number' : 'Where should instant cash-outs go?'}
          </Text>
          <PayoutDestinationForm
            initialNumber={number}
            initialNetwork={network}
            onSave={(nextNetwork, nextNumber) => {
              setDestination(nextNetwork, nextNumber);
              setEditing(false);
              show('Payout number saved', 'success');
            }}
            onCancel={number ? () => setEditing(false) : undefined}
          />
        </GlassView>
      ) : (
        <>
          <GlassView radius="card" style={{ padding: 18, gap: 4 }}>
            <Text className="text-caption" style={{ color: theme.textSecondary }}>Instant cash-outs go to</Text>
            <Text className="text-h2 font-semibold" style={{ color: theme.text, fontVariant: ['tabular-nums'] }}>
              {network} · {maskMomoNumber(number)}
            </Text>
          </GlassView>
          <Button title="Change number" variant="secondary" fullWidth onPress={() => setEditing(true)} />
          <AnimatedPressable onPress={confirmRemove} scaleTo={0.97} style={{ alignSelf: 'center' }}>
            <Text className="text-body-lg font-semibold" style={{ color: colors.semantic.error, paddingVertical: 10 }}>
              Remove number
            </Text>
          </AnimatedPressable>
        </>
      )}

      <Text className="text-caption" style={{ color: theme.textSecondary }}>
        This number is kept on this device and used when you cash out instantly. Your scheduled payout doesn't use it.
      </Text>
    </ScrollView>
  );
}
