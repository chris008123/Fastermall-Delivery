import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/src/theme';
import type { ColorScheme } from '@/src/theme/colors';

interface AvailabilityToggleProps {
  isOnline: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  scheme: ColorScheme;
}

const WIDTH = 60;
const HEIGHT = 34;
const THUMB = 26;
const PADDING = 4;
const TRAVEL = WIDTH - THUMB - PADDING * 2;

/**
 * The driver's most-used control, redesigned to have real weight instead of
 * a system Switch: a filled, color-changing pill with a soft pulsing glow
 * while online — per the redesign brief's note that this control should
 * get "color-fill, subtle glow when online" rather than a generic toggle.
 */
export function AvailabilityToggle({ isOnline, onChange, disabled, scheme }: AvailabilityToggleProps) {
  const theme = colors[scheme];
  const progress = useSharedValue(isOnline ? 1 : 0);
  const glow = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(isOnline ? 1 : 0, { damping: 16, stiffness: 220 });
  }, [isOnline, progress]);

  useEffect(() => {
    if (isOnline) {
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
  }, [isOnline, glow]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [theme.borderStrong, colors.partner.orange]),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * TRAVEL }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: isOnline ? glow.value * 0.5 : 0,
    transform: [{ scale: 1 + glow.value * 0.18 }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: isOnline, disabled }}
      accessibilityLabel={isOnline ? 'Go offline' : 'Go online'}
      disabled={disabled}
      onPress={() => onChange(!isOnline)}
      hitSlop={10}
      style={{ opacity: disabled ? 0.6 : 1, alignSelf: 'flex-start' }}
    >
      <View style={{ width: WIDTH + 12, height: HEIGHT + 12, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: WIDTH + 12,
              height: HEIGHT + 12,
              borderRadius: (HEIGHT + 12) / 2,
              backgroundColor: colors.partner.orange,
            },
            glowStyle,
          ]}
        />
        <Animated.View style={[{ width: WIDTH, height: HEIGHT, borderRadius: HEIGHT / 2, padding: PADDING }, trackStyle]}>
          <Animated.View
            style={[
              { width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: '#ffffff' },
              thumbStyle,
            ]}
          />
        </Animated.View>
      </View>
    </Pressable>
  );
}
