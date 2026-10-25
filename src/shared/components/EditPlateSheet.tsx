import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { Button } from '@/src/shared/components/Button';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';

interface EditPlateSheetProps {
  visible: boolean;
  onClose: () => void;
  initialValue: string;
  onSave: (plate: string) => void;
}

// Follows the same bottom-sheet Modal convention as FareBreakdownSheet /
// SafetySheet: transparent + fade Modal, backdrop Pressable to dismiss,
// inner Pressable stops propagation so taps on the sheet itself don't close it.
export function EditPlateSheet({ visible, onClose, initialValue, onSave }: EditPlateSheetProps) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const [value, setValue] = useState(initialValue);

  // Reset the draft to the current plate each time the sheet opens, so a
  // prior unsaved edit doesn't linger if the partner reopens without saving.
  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  const trimmed = value.trim();

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
            gap: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text className="text-h1 font-bold" style={{ color: theme.text }}>Edit plate number</Text>
            <AnimatedPressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} scaleTo={0.9}>
              <X size={22} color={theme.textSecondary} />
            </AnimatedPressable>
          </View>

          <TextInput accessibilityLabel="Plate number"
            value={value}
            onChangeText={setValue}
            autoCapitalize="characters"
            autoFocus
            placeholder="e.g. AS 4471-24"
            placeholderTextColor={theme.textSecondary}
            style={{
              borderWidth: 1.5,
              borderColor: theme.border,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              fontFamily: 'Fredoka_500Medium',
              color: theme.text,
              backgroundColor: theme.background,
            }}
          />

          <Button
            title="Save"
            variant="partner"
            disabled={trimmed.length === 0}
            onPress={() => {
              if (trimmed.length === 0) return;
              onSave(trimmed);
              onClose();
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
