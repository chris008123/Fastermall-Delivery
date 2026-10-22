import { Text, type TextProps } from 'react-native';
import { type, type TypeVariant } from './tokens';
import { useTheme } from './useTheme';

export type Tone =
  | 'ink'
  | 'secondary'
  | 'tertiary'
  | 'primary'
  | 'go'
  | 'warn'
  | 'alert'
  | 'info'
  | 'onPrimary';

interface TxtProps extends TextProps {
  variant?: TypeVariant;
  tone?: Tone;
  /** Escape hatch for one-off colors (e.g. a job-type ink). Wins over `tone`. */
  color?: string;
}

/** The one text component for redesigned screens. Replaces className-based
 * text so type scale and color come from tokens and flip with the theme. */
export function Txt({ variant = 'body', tone = 'ink', color, style, ...rest }: TxtProps) {
  const { t } = useTheme();
  const tones: Record<Tone, string> = {
    ink: t.ink,
    secondary: t.inkSecondary,
    tertiary: t.inkTertiary,
    primary: t.primary,
    go: t.goInk,
    warn: t.warnInk,
    alert: t.alertInk,
    info: t.infoInk,
    onPrimary: t.onPrimary,
  };

  return (
    <Text
      maxFontSizeMultiplier={1.3}
      {...rest}
      style={[type[variant], { color: color ?? tones[tone] }, style]}
    />
  );
}
