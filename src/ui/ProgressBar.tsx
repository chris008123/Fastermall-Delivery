import { View } from 'react-native';
import { useTheme } from '@/src/ds/useTheme';

interface ProgressBarProps {
  /** 0 to 1 */
  progress: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ progress, color, height = 6 }: ProgressBarProps) {
  const { t } = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{ height, borderRadius: height / 2, backgroundColor: t.sunken, overflow: 'hidden' }}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: color ?? t.primary,
        }}
      />
    </View>
  );
}
