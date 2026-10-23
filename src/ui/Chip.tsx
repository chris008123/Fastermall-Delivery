import { Pressable } from 'react-native';
import { haptics } from '@/src/ds/haptics';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** A filter toggle. Selected chips invert (ink fill) so the active filter
 * is obvious without relying on the brand color. */
export function Chip({ label, selected, onPress }: ChipProps) {
  const { t } = useTheme();
  return (
    <Pressable
      onPress={() => {
        if (!selected) haptics.select();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        minHeight: 40,
        paddingHorizontal: 14,
        justifyContent: 'center',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: selected ? t.ink : t.lineStrong,
        backgroundColor: selected ? t.ink : 'transparent',
      }}
    >
      <Txt variant="label" color={selected ? t.bg : t.inkSecondary}>
        {label}
      </Txt>
    </Pressable>
  );
}
