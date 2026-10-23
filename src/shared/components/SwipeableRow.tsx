import { Trash2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { haptics } from '@/src/shared/utils/haptics';
import { colors } from '@/src/theme';
import { radii } from '@/src/theme/radii';

interface SwipeableRowProps {
  children: ReactNode;
  onDismiss: () => void;
  actionLabel?: string;
  /** What a screen reader's activate (double-tap) does, when the row's content is pressable. */
  onActivate?: () => void;
  /** More actions for screen readers, e.g. mark as unread. Shown in the actions menu. */
  extraActions?: { name: string; label: string; onPress: () => void }[];
}

const THRESHOLD = -88;

/**
 * Swipe-left-to-dismiss with a background reveal that zooms in as you swipe
 * and confirms on release — per the motion spec's rule for swipeable rows
 * (notifications, job cards): "background zoom/shift on swipe, confirm on
 * release". Purely a client-side reveal/hide gesture — the actual removal
 * (`onDismiss`) is left entirely to the caller. Screen readers get a
 * "dismiss" action instead of the gesture. Keep spacing between rows outside
 * this component, or the reveal shows through the gap.
 */
export function SwipeableRow({ children, onDismiss, actionLabel = 'Dismiss', onActivate, extraActions }: SwipeableRowProps) {
  const translateX = useSharedValue(0);
  const [removed, setRemoved] = useState(false);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-14, 14])
    .onUpdate((e) => {
      translateX.value = Math.min(0, e.translationX);
    })
    .onEnd(() => {
      if (translateX.value < THRESHOLD) {
        runOnJS(haptics.light)();
        translateX.value = withTiming(-500, { duration: 220 }, (finished) => {
          if (finished) runOnJS(setRemoved)(true);
        });
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 260 });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backgroundStyle = useAnimatedStyle(() => {
    const progress = interpolate(translateX.value, [THRESHOLD, 0], [1, 0], 'clamp');
    return {
      opacity: progress,
      transform: [{ scale: 0.7 + progress * 0.3 }],
    };
  });

  useEffect(() => {
    if (removed) onDismiss();
    // onDismiss intentionally not in deps — only fire once, when the
    // swipe-away animation actually finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removed]);

  if (removed) return null;

  return (
    <View>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: colors.semantic.error,
            borderRadius: radii.card,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 24,
            gap: 8,
          },
          backgroundStyle,
        ]}
      >
        <Trash2 size={18} color="#ffffff" />
        <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>{actionLabel}</Text>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View
          accessible
          accessibilityActions={[
            ...(onActivate ? [{ name: 'activate' }] : []),
            { name: 'dismiss', label: actionLabel },
            ...(extraActions ?? []).map((a) => ({ name: a.name, label: a.label })),
          ]}
          onAccessibilityAction={(e) => {
            const name = e.nativeEvent.actionName;
            if (name === 'dismiss') onDismiss();
            if (name === 'activate') onActivate?.();
            extraActions?.find((a) => a.name === name)?.onPress();
          }}
          style={rowStyle}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
