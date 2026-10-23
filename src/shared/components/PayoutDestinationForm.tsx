import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { radii } from '@/src/ds/tokens';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import { isValidMomoNumber, type MomoNetwork } from '@/src/stores/payoutStore';
import { Button } from '@/src/ui/Button';
import { Segmented } from '@/src/ui/Segmented';

const NETWORKS: { value: MomoNetwork; label: string }[] = [
  { value: 'MTN', label: 'MTN' },
  { value: 'Telecel', label: 'Telecel' },
  { value: 'AirtelTigo', label: 'AirtelTigo' },
];

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
  const { t } = useTheme();
  const [number, setNumber] = useState(initialNumber ?? '');
  const [network, setNetwork] = useState<MomoNetwork>(initialNetwork);
  const [focused, setFocused] = useState(false);
  const valid = isValidMomoNumber(number);

  return (
    <View style={{ gap: 10 }}>
      <Segmented options={NETWORKS} value={network} onChange={setNetwork} accessibilityLabel="Mobile money network" />
      <TextInput
        value={number}
        onChangeText={(v) => setNumber(v.replace(/\D/g, '').slice(0, 10))}
        placeholder="024 123 4567"
        placeholderTextColor={t.inkTertiary}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        maxLength={10}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel="Mobile money number"
        style={{
          height: 52,
          borderRadius: radii.md,
          borderWidth: 2,
          borderColor: focused ? t.primary : t.lineStrong,
          backgroundColor: t.surface,
          color: t.ink,
          paddingHorizontal: 14,
          fontSize: 18,
          letterSpacing: 1,
          fontFamily: 'Archivo_600SemiBold',
        }}
      />
      {number.length > 0 && !valid ? (
        <Txt variant="caption" tone="alert">
          Enter the 10-digit number, starting with 0.
        </Txt>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {onCancel ? (
          <View style={{ flex: 1 }}>
            <Button title="Cancel" variant="secondary" fullWidth onPress={onCancel} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Button title="Save number" fullWidth disabled={!valid} onPress={() => onSave(network, number)} />
        </View>
      </View>
    </View>
  );
}
