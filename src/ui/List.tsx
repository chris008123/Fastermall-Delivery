import { ChevronRight } from 'lucide-react-native';
import { Children, type ComponentType, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { radii } from '@/src/ds/tokens';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';

interface GroupProps {
  title?: string;
  children: ReactNode;
}

/** A titled, flat list container. Rows are separated by one inset hairline. */
export function Group({ title, children }: GroupProps) {
  const { t } = useTheme();
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <View style={{ gap: 8 }}>
      {title ? (
        <Txt variant="heading" style={{ paddingHorizontal: 4 }}>
          {title}
        </Txt>
      ) : null}
      <View
        style={{
          backgroundColor: t.surface,
          borderRadius: radii.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.line,
          overflow: 'hidden',
        }}
      >
        {rows.map((row, i) => (
          <View key={i}>
            {i > 0 ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.line, marginLeft: 16 }} /> : null}
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}

interface ListRowProps {
  label: string;
  description?: string;
  icon?: ComponentType<{ size?: number; color?: string }>;
  /** Secondary value shown before the chevron, e.g. "Dark". */
  value?: string;
  /** Omit for a static row. */
  onPress?: () => void;
  /** Replaces the chevron, e.g. a Switch. */
  right?: ReactNode;
  disabled?: boolean;
  destructive?: boolean;
}

export function ListRow({
  label,
  description,
  icon: Icon,
  value,
  onPress,
  right,
  disabled,
  destructive,
}: ListRowProps) {
  const { t } = useTheme();

  const content = (pressed: boolean) => (
    <View
      style={{
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 10,
        opacity: disabled ? 0.5 : 1,
        backgroundColor: pressed ? t.sunken : 'transparent',
      }}
    >
      {Icon ? <Icon size={20} color={destructive ? t.alertInk : t.inkSecondary} /> : null}
      <View style={{ flex: 1, gap: 1 }}>
        <Txt variant="body" tone={destructive ? 'alert' : 'ink'}>
          {label}
        </Txt>
        {description ? (
          <Txt variant="caption" tone="secondary">
            {description}
          </Txt>
        ) : null}
      </View>
      {value ? (
        <Txt variant="body" tone="secondary">
          {value}
        </Txt>
      ) : null}
      {right !== undefined ? right : onPress ? <ChevronRight size={18} color={t.inkTertiary} /> : null}
    </View>
  );

  if (!onPress) return content(false);

  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => content(pressed)}
    </Pressable>
  );
}
