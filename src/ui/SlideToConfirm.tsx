import { ChevronsRight } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { haptics } from '@/src/ds/haptics';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';

const HEIGHT = 64;
const THUMB = 56;
const PAD = 4;
const SPRING = { damping: 20, stiffness: 260, mass: 0.8 };

interface SlideToConfirmProps {
  label: string;
  onConfirm: () => void;
  /** True while the action is saving — the thumb stays at the end with a spinner. */
  busy?: boolean;
  /** Thumb and fill color, e.g. the job type's solid color. */
  accent: string;
  /** Icon/spinner color on top of `accent`. */
  onAccent: string;
}

/** For actions that move money or can't easily be undone (like marking the
 * vendor as paid). Needs a deliberate slide to the end, so it can't be
 * triggered by a stray tap. Screen readers get a normal activate action. */
export function SlideToConfirm({ label, onConfirm, busy, accent, onAccent }: SlideToConfirmProps) {
  const { t } = useTheme();
  const [width, setWidth] = useState(0);
  const travel = Math.max(0, width - THUMB - PAD * 2);

  const x = useSharedValue(0);
  const start = useSharedValue(0);
  const travelSv = useSharedValue(0);
  const busyRef = useRef(!!busy);
  busyRef.current = !!busy;

  useEffect(() => {
    travelSv.value = travel;
  }, [travel, travelSv]);

  // Once the save finishes, the thumb returns to the start for the next use.
  useEffect(() => {
    if (!busy) x.value = withSpring(0, SPRING);
  }, [busy, x]);

  const confirmed = () => {
    haptics.success();
    onConfirm();
    // If the action never starts (it was rejected before saving), don't
    // leave the thumb stuck at the end.
    setTimeout(() => {
      if (!busyRef.current) x.value = withSpring(0, SPRING);
    }, 700);
  };

  const pan = Gesture.Pan()
    .enabled(!busy && travel > 0)
    .activeOffsetX([-8, 8])
    .failOffsetY([-14, 14])
    .onBegin(() => {
      start.value = x.value;
    })
    .onUpdate((e) => {
      x.value = Math.min(Math.max(start.value + e.translationX, 0), travelSv.value);
    })
    .onEnd(() => {
      if (x.value >= travelSv.value * 0.85) {
        x.value = withSpring(travelSv.value, SPRING);
        runOnJS(confirmed)();
      } else {
        x.value = withSpring(0, SPRING);
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: x.value + THUMB + PAD }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: travelSv.value > 0 ? 1 - Math.min(x.value / (travelSv.value * 0.6), 1) : 1,
  }));

  return (
    <GestureDetector gesture={pan}>
      <View
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ busy: !!busy, disabled: !!busy }}
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={() => {
          if (!busy) onConfirm();
        }}
        style={{ height: HEIGHT, borderRadius: HEIGHT / 2, backgroundColor: t.sunken, padding: PAD, justifyContent: 'center', overflow: 'hidden' }}
      >
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: HEIGHT / 2, backgroundColor: accent, opacity: 0.28 }, fillStyle]}
        />
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingLeft: THUMB }, labelStyle]}
        >
          <Txt variant="bodyStrong" tone="secondary">
            {label}
          </Txt>
        </Animated.View>
        <Animated.View
          style={[
            { width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' },
            thumbStyle,
          ]}
        >
          {busy ? <ActivityIndicator color={onAccent} /> : <ChevronsRight size={26} color={onAccent} />}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}
