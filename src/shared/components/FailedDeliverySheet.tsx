import * as Linking from 'expo-linking';
import { AlertOctagon, ChevronLeft, MapPinOff, Phone, Store, UserX, Wrench, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { Button } from '@/src/shared/components/Button';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';
import type { FailureReason } from '@/src/types/job';

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

export function FailedDeliverySheet({ visible, onClose, onConfirmFailed, customerName }: FailedDeliverySheetProps) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const [selected, setSelected] = useState<ReasonMeta | null>(null);

  const reset = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={reset}>
      <Pressable onPress={reset} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            paddingBottom: 36,
            gap: 14,
            maxHeight: '85%',
          }}
        >
          {!selected ? (
            <>
              <Text className="text-h1 font-bold" style={{ color: theme.text }}>Can't complete delivery?</Text>
              <Text className="text-caption" style={{ color: theme.textSecondary, marginBottom: 4 }}>
                What's wrong?
              </Text>
              {REASONS.map((r) => (
                <AnimatedPressable key={r.key} onPress={() => setSelected(r)} scaleTo={0.98}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                      padding: 14,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: theme.border,
                    }}
                  >
                    <r.icon size={18} color={theme.textSecondary} />
                    <Text className="text-body-lg font-medium" style={{ color: theme.text, flex: 1 }}>{r.label}</Text>
                  </View>
                </AnimatedPressable>
              ))}
              <AnimatedPressable onPress={reset} scaleTo={0.98} style={{ alignItems: 'center', paddingTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <X size={16} color={theme.textSecondary} />
                  <Text className="text-body-lg font-medium" style={{ color: theme.textSecondary }}>Cancel</Text>
                </View>
              </AnimatedPressable>
            </>
          ) : (
            <>
              <AnimatedPressable onPress={() => setSelected(null)} scaleTo={0.9} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ChevronLeft size={18} color={theme.textSecondary} />
                <Text className="text-caption font-semibold" style={{ color: theme.textSecondary }}>Back</Text>
              </AnimatedPressable>

              <Text className="text-h1 font-bold" style={{ color: theme.text }}>{selected.label}</Text>
              <Text className="text-body" style={{ color: theme.textSecondary }}>{selected.guidance}</Text>

              {selected.showCallCustomer && (
                <Button
                  title={`Call ${customerName}`}
                  variant="secondary"
                  fullWidth
                  onPress={() => Linking.openURL('tel:0000000000').catch(() => {})}
                />
              )}
              <Button
                title="Contact Support"
                variant="secondary"
                fullWidth
                onPress={() => Linking.openURL('tel:0000000000').catch(() => {})}
              />

              <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 4 }} />

              <Button
                title="Mark delivery as failed"
                variant="ghost"
                textClassName="text-error font-semibold"
                fullWidth
                onPress={() => {
                  onConfirmFailed(selected.key);
                  setSelected(null);
                }}
              />
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export { REASONS as FAILURE_REASONS };
export type { ReasonMeta };
