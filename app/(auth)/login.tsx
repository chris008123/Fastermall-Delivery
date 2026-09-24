import { router } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { Button } from '@/src/shared/components/Button';
import { PartnerAuthHeroHeader } from '@/src/shared/components/PartnerAuthHeroHeader';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useAuthStore } from '@/src/stores/authStore';
import { colors } from '@/src/theme';

type Theme = {
  text: string;
  textSecondary: string;
  border: string;
  surface: string;
};

export default function LoginScreen() {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  const signIn = useAuthStore((s) => s.signIn);

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
      className="flex-1 bg-neutral-50 dark:bg-neutral-950"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PartnerAuthHeroHeader
        title="Sign in"
        subtitle="Use the email and password from your partner account."
      />

      <ScrollView
        className="-mt-6 flex-1 rounded-t-[24px] bg-white dark:bg-neutral-900"
        contentContainerStyle={{
          padding: 24,
          paddingBottom: 32,
          gap: 18,
        }}
        keyboardShouldPersistTaps="handled"
      >
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
            value={password}
            onChangeText={setPassword}
            placeholder={'••••••'}
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
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
