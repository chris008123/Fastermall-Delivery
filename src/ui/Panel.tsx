import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { radii } from '@/src/ds/tokens';
import { useTheme } from '@/src/ds/useTheme';

interface PanelProps {
  children: ReactNode;
  padding?: number;
  /** "sunken" is a quiet inset area, e.g. a note inside a panel. */
  tone?: 'surface' | 'sunken';
  /** Makes the whole panel pressable; it darkens slightly while held. */
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

/** Flat container: one fill, one hairline, no shadow. Use sparingly —
 * if everything is a panel, nothing is. */
export function Panel({
  children,
  padding = 16,
  tone = 'surface',
  onPress,
  disabled,
  accessibilityLabel,
  style,
}: PanelProps) {
  const { t } = useTheme();

  const base = (pressed: boolean): ViewStyle => ({
    padding,
    borderRadius: radii.md,
    backgroundColor: tone === 'sunken' || pressed ? t.sunken : t.surface,
    borderWidth: tone === 'sunken' ? 0 : StyleSheet.hairlineWidth,
    borderColor: t.line,
  });

  if (!onPress) {
    return <View style={[base(false), style]}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityState={{ disabled: !!disabled }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base(pressed), style]}
    >
      {children}
    </Pressable>
  );
}
