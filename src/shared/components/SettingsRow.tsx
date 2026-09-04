import { ChevronRight } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';

interface SettingsRowProps {
  icon: ComponentType<{ size?: number; color?: string }>;
  iconColor: string;
  iconBg: string;
  label: string;
  description?: string;
  /** Omit to render a static (non-pressable) row, e.g. a status display. */
  onPress?: () => void;
  /** Custom trailing element (a Switch, a status label, a badge). Defaults
   * to a chevron when the row is pressable, nothing otherwise. */
  right?: React.ReactNode;
  disabled?: boolean;
  /** Renders the label in the semantic error color, e.g. "Delete account". */
  destructive?: boolean;
}

/**
 * One row inside a grouped settings list (see the Settings hub's
 * ACCOUNT / PREFERENCES / APP & PRIVACY / SUPPORT sections). Pulled out as
 * a shared component since the same icon-label-description-trailing shape
 * repeats across the hub and every settings sub-screen (Notifications,
 * Permissions, Security, etc.) — fixing spacing or touch-target sizing here
 * fixes it everywhere, same "fix shared components, not symptoms" pattern
 * as GlassView.
 */
export function SettingsRow({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  description,
  onPress,
  right,
  disabled,
  destructive,
}: SettingsRowProps) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, opacity: disabled ? 0.5 : 1 }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={16} color={iconColor} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text className="text-body-lg font-medium" style={{ color: destructive ? colors.semantic.error : theme.text }}>
          {label}
        </Text>
        {description ? (
          <Text className="text-caption" style={{ color: theme.textSecondary }}>
            {description}
          </Text>
        ) : null}
      </View>
      {right !== undefined ? right : onPress ? <ChevronRight size={18} color={theme.textSecondary} /> : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.98} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}>
      {content}
    </AnimatedPressable>
  );
}

/** Hairline divider between rows inside the same GlassView group, inset
 * past the icon column so it lines up with each row's text rather than
 * running the full card width. */
export function SettingsRowDivider() {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border, marginLeft: 46 }} />;
}
