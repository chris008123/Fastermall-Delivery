import { Pressable, StyleSheet, View } from 'react-native';
import { haptics } from '@/src/ds/haptics';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Read out by screen readers, e.g. "Sort by". */
  accessibilityLabel?: string;
}

/** Equal-width switcher for 2 to 4 short options that change what the
 * screen shows (Available/History, sort order). */
export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedProps<T>) {
  const { t } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: 'row', padding: 3, borderRadius: 12, backgroundColor: t.sunken }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (!active) haptics.select();
              onChange(option.value);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              minHeight: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 9,
              backgroundColor: active ? t.surface : 'transparent',
              borderWidth: active ? StyleSheet.hairlineWidth : 0,
              borderColor: t.lineStrong,
            }}
          >
            <Txt variant="label" tone={active ? 'ink' : 'secondary'}>
              {option.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
