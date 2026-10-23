import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { BackButton } from '@/src/shared/components/BackButton';
import { Button } from '@/src/shared/components/Button';
import { GlassView } from '@/src/shared/components/GlassView';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useToast } from '@/src/shared/toast/ToastProvider';
import {
  isValidMomoNumber,
  maskMomoNumber,
  usePayoutStore,
  type MomoNetwork,
} from '@/src/stores/payoutStore';
import { colors } from '@/src/theme';

const NETWORKS: MomoNetwork[] = ['MTN', 'Telecel', 'AirtelTigo'];

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
  const [draftNumber, setDraftNumber] = useState(number ?? '');
  const [draftNetwork, setDraftNetwork] = useState<MomoNetwork>(network);
  const [focused, setFocused] = useState(false);

  const showForm = editing || !number;
  const valid = isValidMomoNumber(draftNumber);

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
            setDraftNumber('');
            show('Number removed', 'info');
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 48, gap: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>Payout details</Text>
      </View>

      {showForm ? (
        <GlassView radius="card" style={{ padding: 18, gap: 14 }}>
          <Text className="text-card-title font-semibold" style={{ color: theme.text }}>
            {number ? 'Change your number' : 'Where should instant cash-outs go?'}
          </Text>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {NETWORKS.map((n) => {
              const active = draftNetwork === n;
              return (
                <AnimatedPressable key={n} onPress={() => setDraftNetwork(n)} scaleTo={0.97} style={{ flex: 1 }}>
                  <View
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={n}
                    style={{
                      alignItems: 'center',
                      paddingVertical: 12,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: active ? colors.partner.orange : theme.border,
                      backgroundColor: active ? colors.partner.orangeTint : 'transparent',
                    }}
                  >
                    <Text
                      className="text-caption font-semibold"
                      style={{ color: active ? colors.partner.orange : theme.textSecondary }}
                    >
                      {n}
                    </Text>
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>

          <View style={{ gap: 6 }}>
            <Text className="text-caption font-medium" style={{ color: theme.textSecondary }}>
              Mobile money number
            </Text>
            <TextInput
              value={draftNumber}
              onChangeText={(v) => setDraftNumber(v.replace(/\D/g, '').slice(0, 10))}
              placeholder="024 123 4567"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              maxLength={10}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              accessibilityLabel="Mobile money number"
              style={{
                borderWidth: 1.5,
                borderColor: focused ? colors.partner.orange : theme.border,
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 16,
                color: theme.text,
                backgroundColor: theme.surface,
              }}
            />
            {draftNumber.length > 0 && !valid ? (
              <Text className="text-caption" style={{ color: colors.semantic.error }}>
                Enter the 10-digit number, starting with 0.
              </Text>
            ) : null}
          </View>

          <Button
            title="Save number"
            variant="partner"
            fullWidth
            disabled={!valid}
            onPress={() => {
              setDestination(draftNetwork, draftNumber);
              setEditing(false);
              show('Payout number saved', 'success');
            }}
          />
          {number ? (
            <Button
              title="Cancel"
              variant="secondary"
              fullWidth
              onPress={() => {
                setDraftNumber(number);
                setDraftNetwork(network);
                setEditing(false);
              }}
            />
          ) : null}
        </GlassView>
      ) : (
        <>
          <GlassView radius="card" style={{ padding: 18, gap: 4 }}>
            <Text className="text-caption" style={{ color: theme.textSecondary }}>Instant cash-outs go to</Text>
            <Text className="text-h2 font-semibold" style={{ color: theme.text }}>
              {network} · {number ? maskMomoNumber(number) : ''}
            </Text>
          </GlassView>
          <Button
            title="Change number"
            variant="secondary"
            fullWidth
            onPress={() => {
              setDraftNumber(number ?? '');
              setDraftNetwork(network);
              setEditing(true);
            }}
          />
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
