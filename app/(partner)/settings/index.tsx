import { router } from 'expo-router';
import {
  Bell,
  FileLock2,
  HelpCircle,
  Info,
  Lock,
  LogOut,
  MapPin,
  MapPinned,
  Package,
  Palette,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { BackButton } from '@/src/shared/components/BackButton';
import { GlassView } from '@/src/shared/components/GlassView';
import { SettingsRow, SettingsRowSpacer } from '@/src/shared/components/SettingsRow';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useAuthStore } from '@/src/stores/authStore';
import { colors } from '@/src/theme';

/**
 * Settings hub — a pure navigation index into grouped sub-screens, rather
 * than the previous single-card layout that mixed Appearance and
 * Navigation directly into this screen. Every actual control (theme
 * picker, notification toggles, delivery radius, etc.) now lives on its
 * own route so this index stays short regardless of how many settings the
 * app grows. Sections mirror the recommended hierarchy: ACCOUNT,
 * PREFERENCES, APP & PRIVACY, SUPPORT, then Log out on its own.
 */
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 48, gap: 20 }}
    >
      {/* This screen is pushed on top of the headerless (partner) Stack
          (screenOptions sets headerShown: false for every route so the
          tab roots stay clean under the floating nav), which left
          Settings with no visible way back — only an OS swipe/hardware
          gesture. BackButton is the shared fix, also used on the job
          detail and active delivery screens. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>Settings</Text>
      </View>

      <SettingsGroup title="ACCOUNT">
        <SettingsRow
          icon={User}
          iconColor={colors.partner.orange}
          iconBg={colors.partner.orangeTint}
          label="Profile"
          description="Name, mode, and vehicle details"
          onPress={() => router.push('/profile')}
        />
        <SettingsRowSpacer />
        <SettingsRow
          icon={ShieldCheck}
          iconColor={colors.accent.green}
          iconBg="rgba(26, 156, 92, 0.14)"
          label="Documents"
          description="Verification and compliance"
          onPress={() => router.push('/documents')}
        />
        <SettingsRowSpacer />
        <SettingsRow
          icon={Wallet}
          iconColor={colors.brand.teal}
          iconBg={colors.brand.tealTint}
          label="Payout details"
          description="Where instant cash-outs are sent"
          onPress={() => router.push('/settings/payout')}
        />
        <SettingsRowSpacer />
        <SettingsRow
          icon={Lock}
          iconColor={colors.accent.purple}
          iconBg="rgba(139, 92, 246, 0.14)"
          label="Security"
          description="Password, 2FA, and account access"
          onPress={() => router.push('/settings/security')}
        />
      </SettingsGroup>

      <SettingsGroup title="PREFERENCES">
        <SettingsRow
          icon={Bell}
          iconColor={colors.accent.orange}
          iconBg={colors.partner.orangeTint}
          label="Notifications"
          description="Job requests, payments, promotions"
          onPress={() => router.push('/settings/notifications')}
        />
        <SettingsRowSpacer />
        <SettingsRow
          icon={Package}
          iconColor={colors.brand.teal}
          iconBg={colors.brand.tealTint}
          label="Delivery preferences"
          description="Auto-accept, radius, job categories"
          onPress={() => router.push('/settings/delivery-preferences')}
        />
        <SettingsRowSpacer />
        <SettingsRow
          icon={MapPinned}
          iconColor={colors.accent.blue}
          iconBg="rgba(59, 130, 196, 0.14)"
          label="Navigation"
          description="Maps app and route preferences"
          onPress={() => router.push('/settings/navigation')}
        />
        <SettingsRowSpacer />
        <SettingsRow
          icon={Palette}
          iconColor={colors.accent.red}
          iconBg="rgba(214, 69, 69, 0.12)"
          label="Appearance"
          description="Light, dark, or system"
          onPress={() => router.push('/settings/appearance')}
        />
      </SettingsGroup>

      <SettingsGroup title="APP & PRIVACY">
        <SettingsRow
          icon={MapPin}
          iconColor={colors.laundry.blue}
          iconBg={colors.laundry.blueTint}
          label="Location & permissions"
          description="What the app can access on your device"
          onPress={() => router.push('/settings/permissions')}
        />
        <SettingsRowSpacer />
        <SettingsRow
          icon={FileLock2}
          iconColor={colors.semantic.info}
          iconBg={`${colors.semantic.info}22`}
          label="Privacy & data"
          description="Policies, data usage, account deletion"
          onPress={() => router.push('/settings/privacy')}
        />
      </SettingsGroup>

      <SettingsGroup title="SUPPORT">
        <SettingsRow
          icon={HelpCircle}
          iconColor={colors.accent.blue}
          iconBg="rgba(59, 130, 196, 0.14)"
          label="Help & support"
          description="FAQs and contacting Fastermall"
          onPress={() => router.push('/support')}
        />
        <SettingsRowSpacer />
        <SettingsRow
          icon={Info}
          iconColor={colors.brand.goldDark}
          iconBg={`${colors.brand.gold}26`}
          label="About Fastermall"
          description="Version, licenses, and legal"
          onPress={() => router.push('/settings/about')}
        />
      </SettingsGroup>

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

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  return (
    <View style={{ gap: 8 }}>
      <Text
        className="text-overline font-semibold"
        style={{ color: theme.textSecondary, letterSpacing: 0.8, marginLeft: 4 }}
      >
        {title}
      </Text>
      <GlassView radius="card" style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
        {children}
      </GlassView>
    </View>
  );
}
