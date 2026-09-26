import { router } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { Button } from '@/src/shared/components/Button';
import { CourierScene } from '@/src/shared/components/CourierScene';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useAuthStore } from '@/src/stores/authStore';
import { colors } from '@/src/theme';

type Theme = {
  text: string;
  textSecondary: string;
  border: string;
  surface: string;
};

// Motion spec: "Screen entrance — Content fades/slides in in two beats
// (illustration first, then text/form) — keep it brief." The illustration
// plays immediately; the form follows ~120ms later.
const FORM_ENTRANCE_DELAY = 120;

export default function LoginScreen() {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const signIn = useAuthStore((s) => s.signIn);
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    email.trim().length > 0 &&
    email.includes('@') &&
    password.length >= 4;

  const onSubmit = async () => {
    if (!canSubmit) {
      setError('Enter your partner email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      router.replace('/(partner)');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to sign in. Please check your credentials.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingHorizontal: 24,
          paddingBottom: 32,
          gap: 18,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Full-bleed hero illustration, generous whitespace around it
            rather than squeezed against the form — per the redesign brief's
            Login section. */}
        <Animated.View entering={FadeIn.duration(400)} style={{ marginBottom: 4 }}>
          <CourierScene scheme={isDark ? 'dark' : 'light'} height={168} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(FORM_ENTRANCE_DELAY).springify().damping(18).stiffness(180)} style={{ gap: 18 }}>
          <View style={{ gap: 4 }}>
            <Text className="text-h1 font-bold" style={{ color: theme.text }}>Sign in</Text>
            <Text className="text-body" style={{ color: theme.textSecondary }}>
              Use the email and password from your partner account.
            </Text>
          </View>

          <Field
            label="Email address"
            theme={theme}
            icon={<Mail size={18} color={theme.textSecondary} />}
          >
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="partner@example.com"
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordRef.current?.focus()}
              style={{
                flex: 1,
                fontSize: 16,
                color: theme.text,
              }}
            />
          </Field>

          <Field
            label="Password"
            theme={theme}
            icon={<Lock size={18} color={theme.textSecondary} />}
          >
            <TextInput
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              placeholder={'••••••'}
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              returnKeyType="go"
              onSubmitEditing={onSubmit}
              style={{
                flex: 1,
                fontSize: 16,
                color: theme.text,
              }}
            />
          </Field>

          {error && (
            <Text
              className="text-caption"
              style={{ color: colors.semantic.error }}
            >
              {error}
            </Text>
          )}

          <Button
            title="Sign in"
            variant="partner"
            fullWidth
            loading={loading}
            disabled={!canSubmit}
            onPress={onSubmit}
          />

          <AnimatedPressable
            onPress={() => router.push('/(auth)/onboarding')}
            scaleTo={0.98}
            style={{ alignSelf: 'center' }}
          >
            <Text
              className="text-caption font-medium"
              style={{ color: theme.textSecondary }}
            >
              New partner?{' '}
              <Text
                style={{
                  color: colors.partner.orange,
                  fontFamily: 'Fredoka_600SemiBold',
                }}
              >
                Get started
              </Text>
            </Text>
          </AnimatedPressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  icon,
  theme,
  children,
}: {
  label: string;
  icon: ReactNode;
  theme: Theme;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text
        className="text-caption font-medium"
        style={{ color: theme.textSecondary }}
      >
        {label}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderWidth: 1.5,
          borderColor: theme.border,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: theme.surface,
        }}
      >
        {icon}
        {children}
      </View>
    </View>
  );
}
