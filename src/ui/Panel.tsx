import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { radii } from '@/src/ds/tokens';
import { useTheme } from '@/src/ds/useTheme';

interface PanelProps {
  children: ReactNode;
  padding?: number;
  /** "sunken" is a quiet inset area, e.g. a note inside a panel. */
  tone?: 'surface' | 'sunken';
  style?: ViewStyle;
}

/** Flat container: one fill, one hairline, no shadow. Use sparingly —
 * if everything is a panel, nothing is. */
export function Panel({ children, padding = 16, tone = 'surface', style }: PanelProps) {
  const { t } = useTheme();
  return (
    <View
      style={[
        {
          padding,
          borderRadius: radii.md,
          backgroundColor: tone === 'sunken' ? t.sunken : t.surface,
          borderWidth: tone === 'sunken' ? 0 : StyleSheet.hairlineWidth,
          borderColor: t.line,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
