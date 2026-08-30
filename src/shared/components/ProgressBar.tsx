import { View } from 'react-native';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';

interface ProgressBarProps {
  /** 0–1 */
  progress: number;
  color: string;
  trackClassName?: string;
  height?: number;
}

/** Plain track + fill bar — used for the wallet cash-out threshold and any
 * other "you are X% of the way there" indicator. */
export function ProgressBar({ progress, color, height = 8 }: ProgressBarProps) {
  const { isDark } = useResolvedTheme();
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(28,28,26,0.08)',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
