import { router } from 'expo-router';
import { Lock, Phone } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { Button } from '@/src/shared/components/Button';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useAuthStore } from '@/src/stores/authStore';
import { colors } from '@/src/theme';
import { formatGhanaPhone, stripPhoneFormatting } from '@/src/shared/utils/phone';

type Theme = { text: string; textSecondary: string; border: string; surface: string };

export default function LoginScreen() {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const signIn = useAuthStore((s) => s.signIn);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = stripPhoneFormatting(phone).length === 10 && password.length >= 4;

  const onSubmit = () => {
    if (!canSubmit) {
      setError('Enter a valid 10-digit phone number and a password of at least 4 characters.');
      return;
    }
    setError(null);
    setLoading(true);
    // Mock auth — no backend yet, so this just simulates a network round trip.
    setTimeout(() => {
      setLoading(false);
      signIn(stripPhoneFormatting(phone));
      router.replace('/(partner)');
    }, 500);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 18 }}>
        <View style={{ gap: 6, marginBottom: 8 }}>
          <Text className="text-overline font-semibold" style={{ color: colors.partner.orange, letterSpacing: 0.8 }}>
            FASTERMALL PARTNER
          </Text>
          <Text className="text-display font-bold" style={{ color: theme.text }}>Sign in</Text>
          <Text className="text-body" style={{ color: theme.textSecondary }}>
            Use the phone number and password from your partner onboarding.
          </Text>
        </View>

        <Field label="Phone number" theme={theme} icon={<Phone size={18} color={theme.textSecondary} />}>
          <TextInput
            value={phone}
            onChangeText={(v) => setPhone(formatGhanaPhone(v))}
            placeholder="024 412 3456"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
            style={{ flex: 1, fontSize: 16, color: theme.text }}
          />
        </Field>

        <Field label="Password" theme={theme} icon={<Lock size={18} color={theme.textSecondary} />}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="\u2022\u2022\u2022\u2022\u2022\u2022"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            style={{ flex: 1, fontSize: 16, color: theme.text }}
          />
        </Field>

        {error && (
          <Text className="text-caption" style={{ color: colors.semantic.error }}>
            {error}
          </Text>
        )}

        <Button title="Sign in" variant="partner" fullWidth loading={loading} onPress={onSubmit} />
      </View>
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
      <Text className="text-caption font-medium" style={{ color: theme.textSecondary }}>{label}</Text>
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
