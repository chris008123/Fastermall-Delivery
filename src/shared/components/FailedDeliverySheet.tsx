import * as Linking from 'expo-linking';
import { AlertOctagon, ChevronLeft, MapPinOff, Phone, Store, UserX, Wrench } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import type { FailureReason } from '@/src/types/job';
import { Button } from '@/src/ui/Button';
import { Group, ListRow } from '@/src/ui/List';
import { Sheet } from '@/src/ui/Sheet';

interface ReasonMeta {
  key: FailureReason;
  icon: typeof Phone;
  label: string;
  /** Shown once this reason is picked — the "never a dead end" step. */
  guidance: string;
  /** Whether calling the customer is a sensible first move for this reason. */
  showCallCustomer: boolean;
}

const REASONS: ReasonMeta[] = [
  {
    key: 'CUSTOMER_NOT_ANSWERING',
    icon: UserX,
    label: "Customer isn't answering",
    guidance: 'Try contacting the customer first. If you still can’t reach them after a couple of tries, contact support.',
    showCallCustomer: true,
  },
  {
    key: 'WRONG_ADDRESS',
    icon: MapPinOff,
    label: 'Wrong address',
    guidance: 'Confirm the correct address with the customer if you can reach them. If it still doesn’t check out, contact support to update it.',
    showCallCustomer: true,
  },
  {
    key: 'CUSTOMER_REFUSED',
    icon: AlertOctagon,
    label: 'Customer refused order',
    guidance: 'Contact support so we can log the refusal and confirm what happens to the order.',
    showCallCustomer: false,
  },
  {
    key: 'VEHICLE_PROBLEM',
    icon: Wrench,
    label: 'Vehicle problem',
    guidance: 'If you\u2019re safe, contact support so this delivery can be reassigned.',
    showCallCustomer: false,
  },
  {
    key: 'VENDOR_ISSUE',
    icon: Store,
    label: 'Restaurant/store issue',
    guidance: 'Contact support so we can sort this out with the vendor directly.',
    showCallCustomer: false,
  },
  {
    key: 'OTHER',
    icon: AlertOctagon,
    label: 'Other',
    guidance: 'Contact support and describe what happened — we\u2019ll help figure out next steps.',
    showCallCustomer: false,
  },
];

interface FailedDeliverySheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirmFailed: (reason: FailureReason) => void;
  customerName: string;
}

/** Two steps: pick what went wrong, then see what to try before giving up.
 * Never a dead end — every reason leads to a concrete next move, and
 * marking the delivery as failed is the last, clearly separated action. */
export function FailedDeliverySheet({ visible, onClose, onConfirmFailed, customerName }: FailedDeliverySheetProps) {
  const { t } = useTheme();
  const [selected, setSelected] = useState<ReasonMeta | null>(null);

  const reset = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={reset} title={selected ? selected.label : "Can't complete the delivery?"}>
      {!selected ? (
        <View style={{ gap: 12, paddingTop: 4 }}>
          <Txt variant="body" tone="secondary">
            What went wrong?
          </Txt>
          <Group>
            {REASONS.map((r) => (
              <ListRow key={r.key} icon={r.icon} label={r.label} onPress={() => setSelected(r)} />
            ))}
          </Group>
          <Button title="Cancel" variant="quiet" fullWidth onPress={reset} />
        </View>
      ) : (
        <View style={{ gap: 12, paddingTop: 4 }}>
          <Pressable
            onPress={() => setSelected(null)}
            accessibilityRole="button"
            accessibilityLabel="Back to reasons"
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 32, alignSelf: 'flex-start' }}
          >
            <ChevronLeft size={18} color={t.inkSecondary} />
            <Txt variant="label" tone="secondary">
              Back
            </Txt>
          </Pressable>

          <Txt variant="body" tone="secondary">
            {selected.guidance}
          </Txt>

          {selected.showCallCustomer && (
            <Button
              title={`Call ${customerName}`}
              variant="secondary"
              fullWidth
              icon={<Phone size={18} color={t.ink} />}
              onPress={() => Linking.openURL('tel:0000000000').catch(() => {})}
            />
          )}
          <Button
            title="Contact support"
            variant="secondary"
            fullWidth
            onPress={() => Linking.openURL('tel:0000000000').catch(() => {})}
          />

          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.line, marginVertical: 4 }} />

          <Button
            title="Mark delivery as failed"
            variant="destructive"
            fullWidth
            onPress={() => {
              onConfirmFailed(selected.key);
              setSelected(null);
            }}
          />
        </View>
      )}
    </Sheet>
  );
}

export { REASONS as FAILURE_REASONS };
export type { ReasonMeta };
