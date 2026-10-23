import { Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { useNavClearance } from '@/src/shared/components/AppNav';
import { GlassView } from '@/src/shared/components/GlassView';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';
import type { ToastTone } from './ToastProvider';

interface ToastProps {
  message: string;
  tone: ToastTone;
  /** Optional single action, e.g. Undo. */
  actionLabel?: string;
  onAction?: () => void;
}

// Motion spec: "Toast notification, slide-up + fade" — a plain
// entering/exiting layout animation on Animated.View, same vocabulary as
// the rest of the app's Reanimated usage. Sits above whichever nav style
// the partner picked, and only takes touches when it carries an action.
export function Toast({ message, tone, actionLabel, onAction }: ToastProps) {
  const clearance = useNavClearance();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const toneColor = colors.semantic[tone];

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(220)}
      exiting={FadeOutDown.duration(200)}
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: clearance - 12,
        alignItems: 'center',
        paddingHorizontal: 20,
      }}
    >
      <View pointerEvents={onAction ? 'auto' : 'none'} style={{ maxWidth: 440, width: '100%' }}>
        <GlassView
          radius="card"
          intensity="strong"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 16 }}
        >
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: toneColor }} />
          <Text className="text-body font-medium" style={{ color: theme.text, flexShrink: 1, flexGrow: 1 }}>
            {message}
          </Text>
          {actionLabel && onAction ? (
            <AnimatedPressable
              onPress={onAction}
              scaleTo={0.95}
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              hitSlop={10}
            >
              <Text className="text-caption font-semibold" style={{ color: colors.partner.orange }}>
                {actionLabel}
              </Text>
            </AnimatedPressable>
          ) : null}
        </GlassView>
      </View>
    </Animated.View>
  );
}
