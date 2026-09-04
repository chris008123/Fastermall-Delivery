import { router } from 'expo-router';
import { KeyRound, Laptop2, LogOut, Mail, Phone, ShieldCheck, User } from 'lucide-react-native';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { BackButton } from '@/src/shared/components/BackButton';
import { GlassView } from '@/src/shared/components/GlassView';
import { SettingsRow, SettingsRowDivider } from '@/src/shared/components/SettingsRow';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useAuthStore } from '@/src/stores/authStore';
import { usePartnerStore } from '@/src/stores/partnerStore';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { colors } from '@/src/theme';

// Change password/PIN and Trusted devices have no backend to act against
// yet (this app is explicitly frontend-only) — tapping them surfaces what
// the flow will do rather than silently no-op-ing or pretending to submit
// a request that goes nowhere.
function notImplemented(feature: string) {
  Alert.alert(feature, 'This will be available once account management is connected to a backend.');
}

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const partner = usePartnerStore();
  const phone = useAuthStore((s) => s.phone);
  const twoFactorEnabled = useSettingsStore((s) => s.twoFactorEnabled);
  const setTwoFactorEnabled = useSettingsStore((s) => s.setTwoFactorEnabled);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 48, gap: 20 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>Security</Text>
      </View>

      <View style={{ gap: 8 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8, marginLeft: 4 }}>
          PERSONAL INFORMATION
        </Text>
        <GlassView radius="card" style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
          <SettingsRow
            icon={User}
            iconColor={colors.partner.orange}
            iconBg={colors.partner.orangeTint}
            label="Name"
            description={partner.name}
            onPress={() => router.push('/profile')}
          />
          <SettingsRowDivider />
          <SettingsRow
            icon={Phone}
            iconColor={colors.accent.blue}
            iconBg="rgba(59, 130, 196, 0.14)"
            label="Phone number"
            description={phone ?? 'Not set'}
            onPress={() => notImplemented('Change phone number')}
          />
          <SettingsRowDivider />
          <SettingsRow
            icon={Mail}
            iconColor={colors.accent.purple}
            iconBg="rgba(139, 92, 246, 0.14)"
            label="Email"
            description="Not added"
            onPress={() => notImplemented('Add email')}
          />
        </GlassView>
      </View>

      <View style={{ gap: 8 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8, marginLeft: 4 }}>
          ACCOUNT SECURITY
        </Text>
        <GlassView radius="card" style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
          <SettingsRow
            icon={KeyRound}
            iconColor={colors.accent.orange}
            iconBg={colors.partner.orangeTint}
            label="Change password / PIN"
            onPress={() => notImplemented('Change password / PIN')}
          />
          <SettingsRowDivider />
          <SettingsRow
            icon={ShieldCheck}
            iconColor={colors.semantic.success}
            iconBg="rgba(26, 156, 92, 0.14)"
            label="Two-factor authentication"
            description={twoFactorEnabled ? 'Enabled' : 'Off'}
            right={
              <Switch
                value={twoFactorEnabled}
                onValueChange={setTwoFactorEnabled}
                trackColor={{ false: theme.border, true: colors.partner.orangeTint }}
                thumbColor={twoFactorEnabled ? colors.partner.orange : theme.surfaceRaised}
              />
            }
          />
          <SettingsRowDivider />
          <SettingsRow
            icon={Laptop2}
            iconColor={theme.textSecondary}
            iconBg={theme.surfaceRaised}
            label="Trusted devices"
            description="Manage devices signed in to your account"
            onPress={() => notImplemented('Trusted devices')}
          />
        </GlassView>
      </View>

      <AnimatedPressable
        onPress={() => {
          useAuthStore.getState().signOut();
          router.replace('/(auth)/login');
        }}
        scaleTo={0.98}
      >
        <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <LogOut size={18} color={colors.semantic.error} />
          <Text className="text-body-lg font-semibold" style={{ color: colors.semantic.error }}>Log out</Text>
        </GlassView>
      </AnimatedPressable>
    </ScrollView>
  );
}
