import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import { PayoutDestinationForm } from '@/src/shared/components/PayoutDestinationForm';
import { useToast } from '@/src/shared/toast/ToastProvider';
import { maskMomoNumber, usePayoutStore } from '@/src/stores/payoutStore';
import { Button } from '@/src/ui/Button';
import { Panel } from '@/src/ui/Panel';
import { ScreenHeader } from '@/src/ui/ScreenHeader';

export default function PayoutDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTheme();
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

  const showForm = editing || !number;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader title="Payout details" back />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {showForm ? (
          <View style={{ gap: 12 }}>
            <Txt variant="heading">{number ? 'Change your number' : 'Where should instant cash-outs go?'}</Txt>
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
          </View>
        ) : (
          <>
            <Panel style={{ gap: 4 }}>
              <Txt variant="caption" tone="secondary">
                Instant cash-outs go to
              </Txt>
              <Txt variant="title" style={{ fontVariant: ['tabular-nums'] }}>
                {network} · {number ? maskMomoNumber(number) : ''}
              </Txt>
            </Panel>
            <View style={{ gap: 8 }}>
              <Button title="Change number" variant="secondary" fullWidth onPress={() => setEditing(true)} />
              <Pressable
                onPress={confirmRemove}
                accessibilityRole="button"
                style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
              >
                <Txt variant="bodyStrong" tone="alert">
                  Remove number
                </Txt>
              </Pressable>
            </View>
          </>
        )}

        <Txt variant="caption" tone="secondary">
          This number is kept on this device and used when you cash out instantly. Your scheduled payout doesn't use it.
        </Txt>
      </ScrollView>
    </View>
  );
}
