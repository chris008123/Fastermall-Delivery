import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { GlassView } from '@/src/shared/components/GlassView';
import { NAV_BAR_CLEARANCE } from '@/src/shared/components/FloatingNav';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';
import type { ToastTone } from './ToastProvider';

interface ToastProps {
  message: string;
  tone: ToastTone;
}

// Motion spec: "Toast notification, slide-up + fade" — a plain
// entering/exiting layout animation on Animated.View, same vocabulary as
// the rest of the app's Reanimated usage (AnimatedPressable's entering/
// exiting pass-through).
export function Toast({ message, tone }: ToastProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const toneColor = colors.semantic[tone];

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(220)}
      exiting={FadeOutDown.duration(200)}
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: insets.bottom + NAV_BAR_CLEARANCE - 12,
        alignItems: 'center',
        paddingHorizontal: 20,
      }}
    >
      <GlassView
        radius="card"
        intensity="strong"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 16, maxWidth: 440, width: '100%' }}
      >
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: toneColor }} />
        <Text className="text-body font-medium" style={{ color: theme.text, flexShrink: 1 }}>
          {message}
        </Text>
      </GlassView>
    </Animated.View>
  );
}
