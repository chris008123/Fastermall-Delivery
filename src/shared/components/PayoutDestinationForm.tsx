import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { Button } from '@/src/shared/components/Button';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { isValidMomoNumber, type MomoNetwork } from '@/src/stores/payoutStore';
import { colors } from '@/src/theme';

const NETWORKS: MomoNetwork[] = ['MTN', 'Telecel', 'AirtelTigo'];

interface PayoutDestinationFormProps {
  initialNumber?: string | null;
  initialNetwork: MomoNetwork;
  onSave: (network: MomoNetwork, number: string) => void;
  /** Shown as a secondary button next to Save when there's something to go back to. */
  onCancel?: () => void;
}

/** Network + 10-digit mobile money number. Shared by the cash-out sheet
 * and Settings > Payout details so both validate the same way. */
export function PayoutDestinationForm({ initialNumber, initialNetwork, onSave, onCancel }: PayoutDestinationFormProps) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const [number, setNumber] = useState(initialNumber ?? '');
  const [network, setNetwork] = useState<MomoNetwork>(initialNetwork);
  const [focused, setFocused] = useState(false);
  const valid = isValidMomoNumber(number);

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {NETWORKS.map((n) => {
          const active = network === n;
          return (
            <AnimatedPressable key={n} onPress={() => setNetwork(n)} scaleTo={0.97} style={{ flex: 1 }}>
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
          value={number}
          onChangeText={(v) => setNumber(v.replace(/\D/g, '').slice(0, 10))}
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
        {number.length > 0 && !valid ? (
          <Text className="text-caption" style={{ color: colors.semantic.error }}>
            Enter the 10-digit number, starting with 0.
          </Text>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {onCancel ? (
          <View style={{ flex: 1 }}>
            <Button title="Cancel" variant="secondary" fullWidth onPress={onCancel} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Button title="Save number" variant="partner" fullWidth disabled={!valid} onPress={() => onSave(network, number)} />
        </View>
      </View>
    </View>
  );
}
