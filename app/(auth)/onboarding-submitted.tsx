import { router } from 'expo-router';
import { Clock3, ShieldCheck } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/src/shared/components/Button';
import { GlassView } from '@/src/shared/components/GlassView';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';

export default function OnboardingSubmittedScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: insets.top + 40,
        paddingHorizontal: 24,
        paddingBottom: insets.bottom + 24,
        gap: 20,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 42,
          backgroundColor: 'rgba(26, 156, 92, 0.12)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ShieldCheck size={40} color={colors.semantic.success} />
      </View>

      <Text className="text-h1 font-bold" style={{ color: theme.text, textAlign: 'center' }}>
        You're all set!
      </Text>
      <Text className="text-body" style={{ color: theme.textSecondary, textAlign: 'center', paddingHorizontal: 12 }}>
        We've received your details and documents. Our team typically reviews new partners within 24–48 hours.
      </Text>

      <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' }}>
        <Clock3 size={20} color={colors.partner.orange} />
        <Text className="text-caption" style={{ color: theme.textSecondary, flex: 1 }}>
          You can check your verification status anytime from Documents once you sign in.
        </Text>
      </GlassView>

      <View style={{ flex: 1 }} />

      <Button
        title="Continue to sign in"
        variant="partner"
        fullWidth
        onPress={() => router.replace('/(auth)/login')}
      />
    </View>
  );
}
