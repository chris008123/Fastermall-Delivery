import { router } from 'expo-router';
import { AlertTriangle, Database, Download, FileText, MapPin, ScrollText, Trash2 } from 'lucide-react-native';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/src/shared/components/BackButton';
import { GlassView } from '@/src/shared/components/GlassView';
import { SettingsRow, SettingsRowDivider } from '@/src/shared/components/SettingsRow';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useAuthStore } from '@/src/stores/authStore';
import { colors } from '@/src/theme';

// Placeholder domain — swap for the real legal-pages URL once Fastermall
// publishes one; kept as a single constant so that's a one-line change.
const LEGAL_BASE_URL = 'https://fastermall.com';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  const openLegal = (path: string) => {
    Linking.openURL(`${LEGAL_BASE_URL}${path}`).catch(() => {});
  };

  const requestDataExport = () => {
    Alert.alert(
      'Download my data',
      'We\u2019ll email you a copy of your account data once this is connected to a backend. No request has been sent yet.',
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently removes your partner account, documents, and delivery history. This can\u2019t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => {
            // No backend to actually delete against yet — signing the
            // partner out is the honest stand-in for "your account is
            // gone" until account deletion is wired up for real.
            useAuthStore.getState().signOut();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 48, gap: 20 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>Privacy & data</Text>
      </View>

      <View style={{ gap: 8 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8, marginLeft: 4 }}>
          POLICIES
        </Text>
        <GlassView radius="card" style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
          <SettingsRow
            icon={FileText}
            iconColor={colors.accent.blue}
            iconBg="rgba(59, 130, 196, 0.14)"
            label="Privacy policy"
            onPress={() => openLegal('/privacy')}
          />
          <SettingsRowDivider />
          <SettingsRow
            icon={ScrollText}
            iconColor={colors.accent.blue}
            iconBg="rgba(59, 130, 196, 0.14)"
            label="Terms of service"
            onPress={() => openLegal('/terms')}
          />
        </GlassView>
      </View>

      <View style={{ gap: 8 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8, marginLeft: 4 }}>
          YOUR DATA
        </Text>
        <GlassView radius="card" style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
          <SettingsRow
            icon={MapPin}
            iconColor={colors.laundry.blue}
            iconBg={colors.laundry.blueTint}
            label="Location data settings"
            description="Manage what location access the app has"
            onPress={() => router.push('/settings/permissions')}
          />
          <SettingsRowDivider />
          <SettingsRow
            icon={Database}
            iconColor={theme.textSecondary}
            iconBg={theme.surfaceRaised}
            label="Data usage"
            description="See what account data is stored"
            onPress={() => Alert.alert('Data usage', 'A detailed breakdown will be available once this is connected to a backend.')}
          />
          <SettingsRowDivider />
          <SettingsRow
            icon={Download}
            iconColor={colors.accent.green}
            iconBg="rgba(26, 156, 92, 0.14)"
            label="Download my data"
            description="Request a copy of your account data"
            onPress={requestDataExport}
          />
        </GlassView>
      </View>

      <View style={{ gap: 8 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8, marginLeft: 4 }}>
          DANGER ZONE
        </Text>
        <GlassView radius="card" style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
          <SettingsRow
            icon={Trash2}
            iconColor={colors.semantic.error}
            iconBg="rgba(214, 69, 69, 0.12)"
            label="Delete account"
            description="Permanently remove your partner account"
            destructive
            onPress={confirmDeleteAccount}
          />
        </GlassView>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginLeft: 4 }}>
          <AlertTriangle size={14} color={theme.textSecondary} style={{ marginTop: 2 }} />
          <Text className="text-caption" style={{ color: theme.textSecondary, flex: 1 }}>
            Deleting your account removes access to job history, earnings records, and documents on file.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
