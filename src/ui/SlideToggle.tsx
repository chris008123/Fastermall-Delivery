import { ChevronsLeft, ChevronsRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';

const HEIGHT = 64;
const THUMB = 56;
const PAD = 4;
const SPRING = { damping: 20, stiffness: 260, mass: 0.8 };

interface SlideToggleProps {
  isOnline: boolean;
  onChange: (value: boolean) => void;
  /** True while the change is being saved — the thumb shows a spinner. */
  busy?: boolean;
}

/** The availability control. A deliberate slide instead of a tap target,
 * so a rider can't go offline by brushing the screen on a bumpy road.
 * A plain tap nudges the thumb to show what to do; screen readers get a
 * normal activate action instead of the gesture. */
export function SlideToggle({ isOnline, onChange, busy }: SlideToggleProps) {
  const { t } = useTheme();
  const [width, setWidth] = useState(0);
  const travel = Math.max(0, width - THUMB - PAD * 2);

  const x = useSharedValue(0);
  const start = useSharedValue(0);
  const travelSv = useSharedValue(0);

  // Keep the thumb at the resting end for the current state. Runs again
  // when a failed save leaves isOnline unchanged, so the thumb springs back.
  useEffect(() => {
    travelSv.value = travel;
    if (!busy) x.value = withSpring(isOnline ? travel : 0, SPRING);
  }, [isOnline, busy, travel, travelSv, x]);

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
        runOnJS(onChange)(!isOnline);
      } else {
        x.value = withSpring(isOnline ? travelSv.value : 0, SPRING);
      }
    });

  const tap = Gesture.Tap()
    .enabled(enabled)
    .onEnd(() => {
      const nudge = isOnline ? travelSv.value - 40 : 40;
      const rest = isOnline ? travelSv.value : 0;
      x.value = withSequence(withTiming(nudge, { duration: 140 }), withSpring(rest, SPRING));
    });

  const gesture = Gesture.Race(pan, tap);

  const progress = (v: number) => {
    'worklet';
    return travelSv.value > 0 ? v / travelSv.value : 0;
  };

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress(x.value), [0, 1], [t.sunken, t.go]),
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    backgroundColor: interpolateColor(progress(x.value), [0, 1], [t.primary, t.surface]),
  }));
  const offlineLabel = useAnimatedStyle(() => ({
    opacity: interpolate(progress(x.value), [0, 0.5], [1, 0], 'clamp'),
  }));
  const onlineLabel = useAnimatedStyle(() => ({
    opacity: interpolate(progress(x.value), [0.5, 1], [0, 1], 'clamp'),
  }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        onLayout={onLayout}
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
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingLeft: THUMB },
            offlineLabel,
          ]}
        >
          <Txt variant="bodyStrong" tone="secondary">
            Slide to go online
          </Txt>
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingRight: THUMB },
            onlineLabel,
          ]}
        >
          <Txt variant="bodyStrong" color={t.onGo}>
            You're online
          </Txt>
        </Animated.View>
        <Animated.View
          style={[
            { width: THUMB, height: THUMB, borderRadius: THUMB / 2, alignItems: 'center', justifyContent: 'center' },
            thumbStyle,
          ]}
        >
          {busy ? (
            <ActivityIndicator color={isOnline ? t.goInk : t.onPrimary} />
          ) : isOnline ? (
            <ChevronsLeft size={26} color={t.goInk} />
          ) : (
            <ChevronsRight size={26} color={t.onPrimary} />
          )}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
