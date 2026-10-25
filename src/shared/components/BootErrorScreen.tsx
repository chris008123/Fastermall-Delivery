import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';

/** Shown when the app can't start. Always gives the partner a way forward. */
export function BootErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 32,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        backgroundColor: theme.background,
      }}
    >
      <Text className="text-h1 font-bold" style={{ color: theme.text, textAlign: 'center' }}>
        Something went wrong
      </Text>
      <Text className="text-body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
        Fastermall Partner couldn&apos;t start. Check your connection and try again.
      </Text>
      <Text className="text-caption" style={{ color: theme.textSecondary, textAlign: 'center' }}>
        {message}
      </Text>
      <AnimatedPressable
        onPress={onRetry}
        scaleTo={0.96}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        style={{
          marginTop: 8,
          paddingHorizontal: 28,
          paddingVertical: 14,
          borderRadius: 999,
          backgroundColor: colors.partner.orange,
        }}
      >
        <Text className="text-body-lg font-semibold" style={{ color: '#ffffff' }}>
          Try again
        </Text>
      </AnimatedPressable>
    </View>
  );
}
