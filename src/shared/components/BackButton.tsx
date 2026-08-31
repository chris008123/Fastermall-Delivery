import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';

interface BackButtonProps {
  /** Defaults to router.back() — pass a custom handler for screens that
   * need router.replace instead (e.g. when this screen was reached via
   * `replace` and shouldn't leave a dead entry in the stack). */
  onPress?: () => void;
}

/**
 * Small circular back chevron, used on every screen pushed on top of the
 * (partner) group's headerless Stack (Settings, Job detail, Active
 * delivery). The Stack's screenOptions sets headerShown: false globally
 * so the floating-nav tab roots stay clean, which otherwise leaves these
 * pushed screens with no visible way back except an OS swipe/hardware
 * gesture. Kept as a plain in-content row rather than a native Stack
 * header, matching this app's own flat/card visual language instead of
 * the main app's colored native header bar convention.
 */
export function BackButton({ onPress }: BackButtonProps) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  return (
    <AnimatedPressable
      onPress={onPress ?? (() => router.back())}
      scaleTo={0.9}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={{
        height: 36,
        width: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.surfaceRaised,
      }}
    >
      <ChevronLeft size={20} color={theme.text} />
    </AnimatedPressable>
  );
}
