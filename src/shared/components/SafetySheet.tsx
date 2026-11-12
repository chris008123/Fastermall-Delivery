import * as Linking from 'expo-linking';
import { LifeBuoy, Phone, ShieldAlert, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Modal, Pressable, Text, View } from 'react-native';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { telUrl, useSupportNumber } from '@/src/services/supportContact';
import { colors } from '@/src/theme';

interface SafetySheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * "Are you in danger?" sheet, reachable from the Safety button on the
 * active-delivery screen at every stage. Emergency services dials 191
 * (Ghana police); Contact Fastermall Support calls the support number an
 * admin set, or opens the Support screen when none is set yet.
 */
export function SafetySheet({ visible, onClose }: SafetySheetProps) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const router = useRouter();
  const supportNumber = useSupportNumber();

  const contactSupport = () => {
    onClose();
    if (supportNumber) {
      Linking.openURL(telUrl(supportNumber)).catch(() => router.push('/(partner)/support' as never));
    } else {
      router.push('/(partner)/support' as never);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          accessible={false}
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
            icon={LifeBuoy}
            label={supportNumber ? 'Call Fastermall Support' : 'Contact Fastermall Support'}
            color={colors.brand.teal}
            onPress={contactSupport}
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
