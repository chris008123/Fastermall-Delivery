import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { Button } from '@/src/shared/components/Button';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useToast } from '@/src/shared/toast/ToastProvider';
import { colors } from '@/src/theme';
import { pickDocumentImage, type PickSource } from '@/src/utils/documentPicker';

interface PhotoSourceSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  guidance: string;
  /** Opens the front camera (for selfies). */
  front?: boolean;
  /** Called with the photo's local URI once one is picked. */
  onPicked: (uri: string) => void;
}

/** "Take a photo or choose one" sheet, shared by Documents and onboarding.
 * Same modal-sheet look as the Safety sheet. Handles the camera-permission
 * denial and picker errors itself, so the screens only deal with a
 * finished photo. */
export function PhotoSourceSheet({ visible, onClose, title, guidance, front, onPicked }: PhotoSourceSheetProps) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const { show } = useToast();
  const [picking, setPicking] = useState(false);

  const pick = async (source: PickSource) => {
    if (picking) return;
    setPicking(true);
    try {
      const result = await pickDocumentImage(source, { front });
      if (result.status === 'denied') {
        onClose();
        show("Camera access is off. Turn it on in your phone's settings, or choose from your gallery.", 'warning');
        return;
      }
      if (result.status === 'picked') {
        onClose();
        onPicked(result.uri);
      }
    } catch {
      show("Couldn't open that. Please try again.", 'error');
    } finally {
      setPicking(false);
    }
  };

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
            gap: 14,
          }}
        >
          <View style={{ gap: 6 }}>
            <Text className="text-h1 font-bold" style={{ color: theme.text }}>{title}</Text>
            <Text className="text-body" style={{ color: theme.textSecondary }}>{guidance}</Text>
          </View>

          <Button title="Take a photo" variant="partner" size="lg" fullWidth loading={picking} onPress={() => void pick('camera')} />
          <Button
            title="Choose from gallery"
            variant="secondary"
            fullWidth
            disabled={picking}
            onPress={() => void pick('library')}
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
