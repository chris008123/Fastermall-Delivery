import { router } from 'expo-router';
import { Eye, EyeOff, KeyRound } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { BackButton } from '@/src/shared/components/BackButton';
import { Button } from '@/src/shared/components/Button';
import { GlassView } from '@/src/shared/components/GlassView';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useToast } from '@/src/shared/toast/ToastProvider';
import { haptics } from '@/src/shared/utils/haptics';
import { changePassword, checkNewPassword } from '@/src/services/password';
import { colors } from '@/src/theme';

/**
 * Settings > Security > Change password. Needed straight away by partners
 * whose account was created on approval with a temporary password. Other
 * devices are signed out; this one stays signed in.
 */
export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const { show } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [reveal, setReveal] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const errors = checkNewPassword(current, next, confirm);

  const save = async () => {
    if (Object.values(errors).some(Boolean)) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setServerError(null);
    try {
      await changePassword(current, next);
      haptics.success();
      show('Password changed. Other devices have been signed out.', 'success');
      router.back();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Could not change your password. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, value: string, onChange: (v: string) => void, error: string | undefined, autoComplete: 'current-password' | 'new-password') => (
    <View style={{ gap: 6 }}>
      <Text className="text-caption font-medium" style={{ color: theme.textSecondary }}>{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderWidth: 1.5,
          borderColor: showErrors && error ? colors.semantic.error : theme.border,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: theme.surface,
        }}
      >
        <KeyRound size={18} color={theme.textSecondary} />
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!reveal}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={autoComplete === 'current-password' ? 'password' : 'newPassword'}
          style={{ flex: 1, fontSize: 16, color: theme.text }}
        />
      </View>
      {showErrors && error ? (
        <Text accessibilityRole="alert" className="text-caption" style={{ color: colors.semantic.error }}>{error}</Text>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 48, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <BackButton />
          <Text className="text-h1 font-bold" style={{ color: theme.text }}>Change password</Text>
        </View>

        <GlassView radius="card" style={{ padding: 18, gap: 16 }}>
          {field('Current password', current, setCurrent, errors.current, 'current-password')}
          {field('New password', next, setNext, errors.next, 'new-password')}
          {field('Confirm new password', confirm, setConfirm, errors.confirm, 'new-password')}
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
        </GlassView>

        <Text className="text-caption" style={{ color: theme.textSecondary }}>
          At least 8 characters. If you were sent a temporary password when you were approved, enter it as your current password.
        </Text>

        {serverError ? (
          <Text accessibilityRole="alert" className="text-body" style={{ color: colors.semantic.error }}>{serverError}</Text>
        ) : null}

        <Button title="Change password" variant="partner" fullWidth loading={saving} disabled={saving} onPress={() => void save()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
