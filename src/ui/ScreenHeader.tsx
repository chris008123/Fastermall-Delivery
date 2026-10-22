import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';

export function BackButton({ onPress }: { onPress?: () => void }) {
  const { t } = useTheme();
  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={8}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        marginLeft: -10,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.5 : 1,
      })}
    >
      <ArrowLeft size={24} color={t.ink} />
    </Pressable>
  );
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** true = router.back(); a function = custom handler (e.g. router.replace). */
  back?: boolean | (() => void);
  right?: ReactNode;
}

/** Place above the ScrollView, not inside its content — it brings its own
 * 20px side padding and the safe-area top inset. Tab roots get the larger
 * display title; pushed screens (with back) get the smaller title. */
export function ScreenHeader({ title, subtitle, back, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const hasBack = !!back;

  return (
    <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 12, gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 }}>
        {hasBack ? <BackButton onPress={typeof back === 'function' ? back : undefined} /> : null}
        <View style={{ flex: 1 }}>
          <Txt variant={hasBack ? 'title' : 'display'} numberOfLines={1} accessibilityRole="header">
            {title}
          </Txt>
        </View>
        {right}
      </View>
      {subtitle ? (
        <Txt variant="body" tone="secondary">
          {subtitle}
        </Txt>
      ) : null}
    </View>
  );
}
