import { Pressable, type GestureResponderEvent, type PressableProps } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { cssInterop } from 'nativewind';
import { springs } from '@/src/shared/animation/constants';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);
cssInterop(AnimatedPressableBase, { className: 'style' });

interface AnimatedPressableProps extends PressableProps {
  /** Scale value on press-in. Defaults to a subtle 0.96 (cards use 0.98, buttons 0.96). */
  scaleTo?: number;
  /** Spring physics for the press animation. Defaults to `springs.snappy`;
   * pass `springs.buttonPress` for the crisper, near-zero-overshoot feel
   * the motion spec calls for on primary buttons specifically. */
  springConfig?: typeof springs.snappy;
  // Reanimated's layout-animation prop types are stricter than the actual
  // range of values (`FadeInUp`, `FadeInUp.delay(80)`, etc.) that get
  // passed in practice — loosened here rather than importing Reanimated's
  // full animation-builder type surface just for these two pass-through props.
  entering?: unknown;
  exiting?: unknown;
  className?: string;
}

/**
 * Base touch-feedback primitive, ported as-is from the customer app: scales
 * down on press-in, springs back on release. Note from that codebase (kept
 * here since it still applies): layout/background styles don't reliably
 * apply directly on this component once cssInterop is attached — put those
 * on a plain wrapping View instead (see Button.tsx for the pattern).
 */
export function AnimatedPressable({
  scaleTo = 0.96,
  springConfig = springs.snappy,
  onPressIn,
  onPressOut,
  style,
  entering,
  exiting,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: GestureResponderEvent) => {
    scale.value = withSpring(scaleTo, { ...springConfig, reduceMotion: ReduceMotion.System });
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    scale.value = withSpring(1, { ...springConfig, reduceMotion: ReduceMotion.System });
    onPressOut?.(e);
  };

  return (
    <AnimatedPressableBase
      entering={entering as never}
      exiting={exiting as never}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style]}
      {...rest}
    />
  );
}
