import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Text, View } from 'react-native';
import { colors } from '@/src/theme';
import { AnimatedPressable } from './AnimatedPressable';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import type { PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'laundry' | 'partner';
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
      android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: false }}
      style={[{ borderRadius: RADIUS, overflow: 'hidden' }, style] as never}
      {...rest}
    >
      <View
        className={className}
        style={[
          alignStyle,
          sizeStyle[size],
          { borderRadius: RADIUS },
          fullWidth ? { width: '100%' as const } : null,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={v.spinner} />
        ) : (
          <Text className={`text-body-lg ${textClassName ?? v.text}`} style={{ letterSpacing: 0.2 }}>
            {title}
          </Text>
        )}
      </View>
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
