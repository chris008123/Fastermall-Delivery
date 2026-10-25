import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/src/theme';
import { springs } from '@/src/shared/animation/constants';
import { AnimatedPressable } from './AnimatedPressable';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import type { PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'laundry' | 'partner' | 'destructive';
type Size = 'md' | 'lg' | 'sm';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  textClassName?: string;
}

// Ported from the customer app: plain style values instead of
// px-*/py-*/min-h-* classNames on AnimatedPressable, since layout
// classNames weren't reliably applying on that build. Kept as the default
// here too rather than re-discovering the same bug.
const sizeStyle: Record<Size, { paddingHorizontal: number; paddingVertical: number; minHeight: number }> = {
  sm: { paddingHorizontal: 16, paddingVertical: 10, minHeight: 44 },
  md: { paddingHorizontal: 24, paddingVertical: 16, minHeight: 54 },
  lg: { paddingHorizontal: 28, paddingVertical: 18, minHeight: 60 },
};

const RADIUS = 999;

interface VariantStyle {
  gradient?: [string, string];
  flat?: { backgroundColor: string; borderWidth?: number; borderColor?: string };
  text: string;
  spinner: string;
  shadowColor?: string;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  fullWidth,
  className,
  textClassName,
  style,
  ...rest
}: ButtonProps & { className?: string }) {
  const { isDark } = useResolvedTheme();
  const isDisabled = disabled || loading;

  const disabledBg = isDark ? colors.neutral[700] : colors.neutral[300];

  // Loading state gets a slow opacity pulse (rather than a static block) so
  // there's motion behind the spinner instead of a dead frozen button —
  // the "streaming shimmer, not a blank spinner-only state" rule from the
  // motion spec, kept to a simple pulse rather than a translating gradient
  // sweep to stay predictable across every variant/size combination.
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);

  // With reduce motion on, the spinner alone shows loading — no pulsing.
  useEffect(() => {
    if (loading && !reduceMotion) {
      pulse.value = withRepeat(withTiming(0.6, { duration: 650, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      cancelAnimation(pulse);
      pulse.value = 1;
    }
    return () => cancelAnimation(pulse);
  }, [loading, reduceMotion, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: loading ? pulse.value : 1,
  }));

  const variants: Record<Variant, VariantStyle> = {
    primary: isDisabled
      ? { flat: { backgroundColor: disabledBg }, text: 'text-neutral-600 dark:text-neutral-400 font-semibold', spinner: colors.onBrand }
      : { gradient: [colors.brand.tealDark, colors.brand.tealBright], text: 'text-white font-semibold', spinner: colors.onBrand, shadowColor: colors.brand.teal },
    secondary: isDisabled
      ? { flat: { backgroundColor: isDark ? colors.neutral[800] : colors.neutral[100], borderWidth: 1, borderColor: isDark ? colors.dark.border : colors.light.border }, text: 'text-neutral-500 dark:text-neutral-500', spinner: colors.brand.teal }
      : { flat: { backgroundColor: colors.brand.tealTint, borderWidth: 1, borderColor: 'rgba(6, 112, 105, 0.15)' }, text: 'text-brand-teal font-semibold', spinner: colors.brand.teal },
    ghost: {
      flat: { backgroundColor: 'transparent' },
      text: isDisabled ? 'text-neutral-500 dark:text-neutral-500' : 'text-brand-teal font-semibold',
      spinner: colors.brand.teal,
    },
    gold: isDisabled
      ? { flat: { backgroundColor: disabledBg }, text: 'text-neutral-800 dark:text-neutral-400 font-semibold', spinner: colors.neutral[900] }
      : { gradient: [colors.brand.goldDark, colors.brand.gold], text: 'text-neutral-900 font-semibold', spinner: colors.neutral[900], shadowColor: colors.brand.goldDark },
    laundry: isDisabled
      ? { flat: { backgroundColor: disabledBg }, text: 'text-neutral-800 dark:text-neutral-400 font-semibold', spinner: colors.onBrand }
      : { gradient: [colors.laundry.blueDark, colors.laundry.blueBright], text: 'text-white font-semibold', spinner: colors.onBrand, shadowColor: colors.laundry.blue },
    // The partner app's own accent — used for availability, accepting a
    // job, and wallet actions, so those read as "you, the partner" rather
    // than being tinted like any one of the three job types.
    partner: isDisabled
      ? { flat: { backgroundColor: disabledBg }, text: 'text-neutral-600 dark:text-neutral-400 font-semibold', spinner: colors.onBrand }
      : { gradient: [colors.partner.orangeDark, colors.partner.orangeBright], text: 'text-white font-semibold', spinner: colors.onBrand, shadowColor: colors.partner.orange },
    // Semantic red, always — for "Report failed delivery", "Cancel job",
    // and any other destructive action. Never substitute a job-type or
    // partner-orange color here, per the design system's Layer 3 rule.
    destructive: isDisabled
      ? { flat: { backgroundColor: disabledBg }, text: 'text-neutral-600 dark:text-neutral-400 font-semibold', spinner: colors.onBrand }
      : { flat: { backgroundColor: colors.semantic.error }, text: 'text-white font-semibold', spinner: colors.onBrand, shadowColor: colors.semantic.error },
  };

  const v = variants[variant];

  const alignStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  const content = (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={isDisabled}
      scaleTo={0.96}
      springConfig={springs.buttonPress}
      android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: false }}
      style={[{ borderRadius: RADIUS, overflow: 'hidden' }, style] as never}
      {...rest}
    >
      <Animated.View
        className={className}
        style={[
          alignStyle,
          sizeStyle[size],
          { borderRadius: RADIUS },
          fullWidth ? { width: '100%' as const } : null,
          pulseStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={v.spinner} />
        ) : (
          <Text className={`text-body-lg ${textClassName ?? v.text}`} style={{ letterSpacing: 0.2 }}>
            {title}
          </Text>
        )}
      </Animated.View>
    </AnimatedPressable>
  );

  const outerStyle = [
    { borderRadius: RADIUS },
    fullWidth ? { width: '100%' as const } : null,
    v.shadowColor
      ? { shadowColor: v.shadowColor, shadowOffset: { width: 0, height: 6 }, shadowOpacity: isDark ? 0.35 : 0.22, shadowRadius: 12, elevation: 6 }
      : null,
  ];

  if (v.gradient) {
    return (
      <View style={outerStyle}>
        <LinearGradient colors={v.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: RADIUS, overflow: 'hidden' }}>
          {content}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={outerStyle}>
      <View style={[{ borderRadius: RADIUS, overflow: 'hidden' }, v.flat]}>{content}</View>
    </View>
  );
}
