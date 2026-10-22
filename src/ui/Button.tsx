import type { ReactNode } from 'react';
import { ActivityIndicator, View, type PressableProps, type ViewStyle } from 'react-native';
import { springs } from '@/src/shared/animation/constants';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import type { JobType } from '@/src/types/job';

type Variant = 'primary' | 'secondary' | 'quiet' | 'go' | 'destructive' | 'job';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  /** Required when variant is "job" — fills with that job type's color. */
  jobType?: JobType;
  icon?: ReactNode;
  style?: ViewStyle;
}

const SIZE: Record<Size, { minHeight: number; paddingHorizontal: number }> = {
  sm: { minHeight: 44, paddingHorizontal: 18 },
  md: { minHeight: 52, paddingHorizontal: 24 },
  lg: { minHeight: 60, paddingHorizontal: 28 },
};

/** Layout and fill live on the inner View, not on AnimatedPressable —
 * layout styles don't reliably apply on that component once cssInterop is
 * attached (same constraint the old Button worked around). */
export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  fullWidth,
  jobType,
  icon,
  style,
  ...rest
}: ButtonProps) {
  const { t, job } = useTheme();
  const isDisabled = disabled || loading;

  let bg = t.primary;
  let fg = t.onPrimary;
  let border: string | undefined;

  if (variant === 'secondary') {
    bg = 'transparent';
    fg = t.ink;
    border = t.lineStrong;
  } else if (variant === 'quiet') {
    bg = 'transparent';
    fg = t.primary;
  } else if (variant === 'go') {
    bg = t.go;
    fg = t.onGo;
  } else if (variant === 'destructive') {
    bg = t.alert;
    fg = t.onAlert;
  } else if (variant === 'job' && jobType) {
    const j = job(jobType);
    bg = j.solid;
    fg = j.onSolid;
  }

  if (isDisabled && !loading) {
    bg = variant === 'quiet' || variant === 'secondary' ? 'transparent' : t.sunken;
    fg = t.inkTertiary;
    border = variant === 'secondary' ? t.line : undefined;
  }

  const s = SIZE[size];

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      scaleTo={0.98}
      springConfig={springs.buttonPress as never}
      style={[fullWidth ? { width: '100%' } : null, style] as never}
      {...rest}
    >
      <View
        style={{
          ...s,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: 999,
          backgroundColor: bg,
          borderWidth: border ? 1.5 : 0,
          borderColor: border,
        }}
      >
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <>
            {icon}
            <Txt variant={size === 'sm' ? 'label' : 'bodyStrong'} color={fg}>
              {title}
            </Txt>
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}
