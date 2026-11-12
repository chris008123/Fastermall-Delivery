import { router, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff, Hash, KeyRound, Mail } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { Button } from '@/src/shared/components/Button';
import { PartnerAuthHeroHeader } from '@/src/shared/components/PartnerAuthHeroHeader';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { haptics } from '@/src/shared/utils/haptics';
import { checkResetForm, requestResetCode, resetWithCode } from '@/src/services/password';
import { colors } from '@/src/theme';

/**
 * "Set up account or reset password". New partners arrive here from their
 * approval email with a 6-digit setup code; anyone who forgot their password
 * asks for a code here. Either way they choose their own password.
 */
export default function SetPasswordScreen() {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [reveal, setReveal] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const errors = checkResetForm(email, code, password, confirm);

  const sendCode = async () => {
    if (errors.email) {
      setShowErrors(true);
      return;
    }
    setSending(true);
    setError(null);
    try {
      await requestResetCode(email);
      setNotice(`If ${email.trim().toLowerCase()} has a partner account, we’ve emailed it a new code. It works for 15 minutes.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send a code. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const save = async () => {
    if (Object.values(errors).some(Boolean)) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await resetWithCode(email, code, password);
      haptics.success();
      router.replace({ pathname: '/(auth)/login', params: { email: email.trim().toLowerCase(), passwordSet: '1' } } as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not set your password. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const shown = (key: keyof typeof errors) => (showErrors ? errors[key] : undefined);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-50 dark:bg-neutral-950"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PartnerAuthHeroHeader
        title="Set up account or reset password"
        subtitle="Use the code from your email, then choose your password."
        onBack={() => router.back()}
        height={172}
      />
      <ScrollView
        className="-mt-6 flex-1 rounded-t-[24px] bg-white dark:bg-neutral-900"
        contentContainerStyle={{ padding: 24, paddingBottom: 32, gap: 18 }}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Email" error={shown('email')} theme={theme} icon={<Mail size={18} color={theme.textSecondary} />}>
          <TextInput
            accessibilityLabel="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="The email you applied with"
            placeholderTextColor={theme.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={{ flex: 1, fontSize: 16, color: theme.text }}
          />
        </Field>

        <Field label="6-digit code" error={shown('code')} theme={theme} icon={<Hash size={18} color={theme.textSecondary} />}>
          <TextInput
            accessibilityLabel="6-digit code"
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            placeholder="From your email"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            style={{ flex: 1, fontSize: 16, color: theme.text, letterSpacing: 2 }}
          />
        </Field>
        <AnimatedPressable onPress={() => void sendCode()} disabled={sending} style={{ alignSelf: 'flex-start' }} accessibilityLabel="Email me a new code">
          <Text className="text-caption font-semibold" style={{ color: colors.partner.orange, opacity: sending ? 0.5 : 1 }}>
            {sending ? 'Sending…' : 'Email me a new code'}
          </Text>
        </AnimatedPressable>
        {notice ? (
          <Text accessibilityLiveRegion="polite" className="text-caption" style={{ color: theme.textSecondary }}>{notice}</Text>
        ) : null}

        <Field label="New password" error={shown('next')} theme={theme} icon={<KeyRound size={18} color={theme.textSecondary} />}>
          <TextInput
            accessibilityLabel="New password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!reveal}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            placeholder="At least 8 characters"
            placeholderTextColor={theme.textSecondary}
            style={{ flex: 1, fontSize: 16, color: theme.text }}
          />
        </Field>
        <Field label="Confirm new password" error={shown('confirm')} theme={theme} icon={<KeyRound size={18} color={theme.textSecondary} />}>
          <TextInput
            accessibilityLabel="Confirm new password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!reveal}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            style={{ flex: 1, fontSize: 16, color: theme.text }}
          />
        </Field>
        <AnimatedPressable
          onPress={() => setReveal((r) => !r)}
          accessibilityRole="switch"
          accessibilityState={{ checked: reveal }}
          accessibilityLabel="Show passwords"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}
        >
          {reveal ? <EyeOff size={16} color={theme.textSecondary} /> : <Eye size={16} color={theme.textSecondary} />}
          <Text className="text-caption font-medium" style={{ color: theme.textSecondary }}>
            {reveal ? 'Hide passwords' : 'Show passwords'}
          </Text>
        </AnimatedPressable>

        {error ? (
          <Text accessibilityRole="alert" className="text-body" style={{ color: colors.semantic.error }}>{error}</Text>
        ) : null}

        <Button title="Set password" variant="partner" fullWidth loading={saving} disabled={saving} onPress={() => void save()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  icon,
  error,
  theme,
  children,
}: {
  label: string;
  icon: ReactNode;
  error?: string;
  theme: { textSecondary: string; border: string; surface: string };
  children: ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text className="text-caption font-medium" style={{ color: theme.textSecondary }}>{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderWidth: 1.5,
          borderColor: error ? colors.semantic.error : theme.border,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: theme.surface,
        }}
      >
        {icon}
        {children}
      </View>
      {error ? (
        <Text accessibilityRole="alert" className="text-caption" style={{ color: colors.semantic.error }}>{error}</Text>
      ) : null}
    </View>
  );
}
