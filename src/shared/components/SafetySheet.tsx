import * as Linking from 'expo-linking';
import { LifeBuoy, MapPin, Phone, ShieldAlert, X } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';

interface SafetySheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * "Are you in danger?" confirm sheet — reachable from a one-tap Safety
 * button on the active-delivery screen. Every action here is mock (no
 * backend/telephony to actually call out to), but the flow itself is
 * real: this is the one screen in the whole app the research flagged as
 * non-optional, so it stays reachable regardless of which pipeline stage
 * the delivery is in.
 */
export function SafetySheet({ visible, onClose }: SafetySheetProps) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
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
                backgroundColor: `${colors.semantic.error}1F`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldAlert size={26} color={colors.semantic.error} />
            </View>
            <Text className="text-h1 font-bold" style={{ color: theme.text }}>Are you in danger?</Text>
          </View>

          <SafetyAction
            icon={Phone}
            label="Call Emergency Services"
            color={colors.semantic.error}
            onPress={() => {
              Linking.openURL('tel:191').catch(() => {});
              onClose();
            }}
          />
          <SafetyAction
            icon={MapPin}
            label="Share My Location"
            color={colors.partner.orange}
            onPress={onClose}
          />
          <SafetyAction
            icon={LifeBuoy}
            label="Contact Fastermall Support"
            color={colors.brand.teal}
            onPress={onClose}
          />

          <AnimatedPressable onPress={onClose} scaleTo={0.98} style={{ alignItems: 'center', paddingTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <X size={16} color={theme.textSecondary} />
              <Text className="text-body-lg font-medium" style={{ color: theme.textSecondary }}>Cancel</Text>
            </View>
          </AnimatedPressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SafetyAction({
  icon: Icon,
  label,
  color,
  onPress,
}: {
  icon: typeof Phone;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.98}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          padding: 16,
          borderRadius: 18,
          borderWidth: 1.5,
          borderColor: theme.border,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${color}1F`,
          }}
        >
          <Icon size={18} color={color} />
        </View>
        <Text className="text-body-lg font-semibold" style={{ color: theme.text, flex: 1 }}>{label}</Text>
      </View>
    </AnimatedPressable>
  );
}
