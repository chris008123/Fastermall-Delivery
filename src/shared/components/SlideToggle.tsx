import { ChevronsLeft, ChevronsRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  ReduceMotion,
  cancelAnimation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { haptics } from '@/src/shared/utils/haptics';
import { colors } from '@/src/theme';

const HEIGHT = 56;
const THUMB = 48;
const PAD = 4;
// reduceMotion: System makes the thumb snap to its resting end instead of
// springing when the phone's "reduce motion" setting is on.
const SPRING = { damping: 20, stiffness: 260, mass: 0.8, reduceMotion: ReduceMotion.System };
// While reduced motion is on, the online glow holds at this steady level
// instead of pulsing.
const STEADY_GLOW = 0.6;

interface SlideToggleProps {
  isOnline: boolean;
  onChange: (value: boolean) => void;
  /** True while the change is being saved — the thumb shows a spinner. */
  busy?: boolean;
  /** When true, a single tap while online goes offline (going online still needs a slide). */
  offlineByTap?: boolean;
}

/**
 * The availability control. Same character as the original toggle — a
 * color-filling pill in partner orange with a soft pulsing glow while
 * online — but you slide it, so a rider can't go offline by brushing the
 * screen on a bumpy road. A plain tap nudges the thumb to show what to do;
 * screen readers get a normal activate action instead of the gesture.
 */
export function SlideToggle({ isOnline, onChange, busy, offlineByTap }: SlideToggleProps) {
  const { isDark } = useResolvedTheme();
  const reduceMotion = useReducedMotion();
  const theme = isDark ? colors.dark : colors.light;
  const [width, setWidth] = useState(0);
  const travel = Math.max(0, width - THUMB - PAD * 2);

  const x = useSharedValue(0);
  const start = useSharedValue(0);
  const travelSv = useSharedValue(0);
  const glow = useSharedValue(0);

  // Keep the thumb at the resting end for the current state. Runs again
  // when a failed save leaves isOnline unchanged, so the thumb springs back.
  useEffect(() => {
    travelSv.value = travel;
    if (!busy) x.value = withSpring(isOnline ? travel : 0, SPRING);
  }, [isOnline, busy, travel, travelSv, x]);

  // Soft pulsing glow while online, like the original toggle. With reduce
  // motion on it stays as a steady, non-moving halo.
  useEffect(() => {
    if (isOnline && reduceMotion) {
      cancelAnimation(glow);
      glow.value = STEADY_GLOW;
    } else if (isOnline) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.35, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(glow);
      glow.value = 0;
    }
    return () => cancelAnimation(glow);
  }, [isOnline, reduceMotion, glow]);

  const enabled = !busy && travel > 0;

  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-8, 8])
    .failOffsetY([-14, 14])
    .onBegin(() => {
      start.value = x.value;
    })
    .onUpdate((e) => {
      x.value = Math.min(Math.max(start.value + e.translationX, 0), travelSv.value);
    })
    .onEnd(() => {
      const done = isOnline ? x.value <= travelSv.value * 0.3 : x.value >= travelSv.value * 0.7;
      if (done) {
        x.value = withSpring(isOnline ? 0 : travelSv.value, SPRING);
        runOnJS(haptics.success)();
        runOnJS(onChange)(!isOnline);
      } else {
        x.value = withSpring(isOnline ? travelSv.value : 0, SPRING);
      }
    });

  const tap = Gesture.Tap()
    .enabled(enabled)
    .onEnd(() => {
      if (isOnline && offlineByTap) {
        runOnJS(haptics.success)();
        runOnJS(onChange)(false);
        return;
      }
      runOnJS(haptics.light)();
      const nudge = isOnline ? travelSv.value - 40 : 40;
      const rest = isOnline ? travelSv.value : 0;
      x.value = withSequence(
        withTiming(nudge, { duration: 140, reduceMotion: ReduceMotion.System }),
        withSpring(rest, SPRING),
      );
    });

  const gesture = Gesture.Race(pan, tap);

  const progress = (v: number) => {
    'worklet';
    return travelSv.value > 0 ? v / travelSv.value : 0;
  };

  const offTrack = isDark ? 'rgba(247, 243, 236, 0.14)' : 'rgba(28, 26, 22, 0.1)';

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress(x.value), [0, 1], [offTrack, colors.partner.orange]),
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: isOnline ? glow.value * 0.45 : 0,
    transform: [{ scale: reduceMotion ? 1 : 1 + glow.value * 0.04 }],
  }));
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const offlineLabel = useAnimatedStyle(() => ({
    opacity: interpolate(progress(x.value), [0, 0.5], [1, 0], 'clamp'),
  }));
  const onlineLabel = useAnimatedStyle(() => ({
    opacity: interpolate(progress(x.value), [0.5, 1], [0, 1], 'clamp'),
  }));

  const fill = { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' } as const;

  return (
    <View>
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', left: -4, right: -4, top: -4, bottom: -4, borderRadius: (HEIGHT + 8) / 2, backgroundColor: colors.partner.orange },
          glowStyle,
        ]}
      />
      <GestureDetector gesture={gesture}>
        <Animated.View
          onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
          accessible
          accessibilityRole="switch"
          accessibilityLabel="Availability"
          accessibilityValue={{ text: isOnline ? 'Online' : 'Offline' }}
          accessibilityState={{ checked: isOnline, busy: !!busy }}
          accessibilityActions={[{ name: 'activate', label: isOnline ? 'Go offline' : 'Go online' }]}
          onAccessibilityAction={(e) => {
            if (e.nativeEvent.actionName === 'activate' && !busy) onChange(!isOnline);
          }}
          style={[{ height: HEIGHT, borderRadius: HEIGHT / 2, padding: PAD, justifyContent: 'center' }, trackStyle]}
        >
          <Animated.View pointerEvents="none" style={[fill, { paddingLeft: THUMB }, offlineLabel]}>
            <Text className="text-body-lg font-semibold" style={{ color: theme.textSecondary }}>
              Slide to go online
            </Text>
          </Animated.View>
          <Animated.View pointerEvents="none" style={[fill, { paddingRight: THUMB }, onlineLabel]}>
            <Text className="text-body-lg font-semibold" style={{ color: '#ffffff' }}>
              {offlineByTap ? 'Online · tap to go offline' : "You're online"}
            </Text>
          </Animated.View>
          <Animated.View
            style={[
              {
                width: THUMB,
                height: THUMB,
                borderRadius: THUMB / 2,
                backgroundColor: '#ffffff',
                alignItems: 'center',
                justifyContent: 'center',
              },
              thumbStyle,
            ]}
          >
            {busy ? (
              <ActivityIndicator color={colors.partner.orange} />
            ) : isOnline ? (
              <ChevronsLeft size={24} color={colors.partner.orange} />
            ) : (
              <ChevronsRight size={24} color={colors.partner.orange} />
            )}
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
