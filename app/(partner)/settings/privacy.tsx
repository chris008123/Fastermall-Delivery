import { router } from 'expo-router';
import { AlertTriangle, Database, Download, FileText, MapPin, ScrollText, Trash2 } from 'lucide-react-native';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/src/shared/components/BackButton';
import { GlassView } from '@/src/shared/components/GlassView';
import { SettingsRow, SettingsRowSpacer } from '@/src/shared/components/SettingsRow';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { SUPPORT_EMAIL } from '@/src/config/contact';
import { useAuthStore } from '@/src/stores/authStore';
import { colors } from '@/src/theme';
import { buildDeletionRequestMailto } from '@/src/utils/accountDeletion';

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

  // The app can't delete an account itself yet, so this asks support to do
  // it and says so. Nothing is deleted, and the partner stays signed in,
  // until support confirms. Swap for a real in-app deletion call once the
  // backend has one (see BACKEND_CHANGES_NEEDED.md).
  const openDeletionEmail = () => {
    const accountEmail = useAuthStore.getState().user?.email;
    Linking.openURL(buildDeletionRequestMailto(SUPPORT_EMAIL, accountEmail)).catch(() => {
      Alert.alert(
        'No email app found',
        `Please email ${SUPPORT_EMAIL} from another app and ask us to delete your partner account. Use the email address you sign in with.`,
      );
    });
  };

  const requestAccountDeletion = () => {
    Alert.alert(
      'Request account deletion',
      'This opens an email to Fastermall support asking them to delete your partner account.\n\nNothing is deleted yet. Your account stays active until support confirms with you.\n\nSome records, such as completed deliveries and payouts, may have to be kept for legal or accounting reasons.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open email', onPress: openDeletionEmail },
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
          <SettingsRowSpacer />
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
            label="Permissions"
            description="Camera and photo access on this phone"
            onPress={() => router.push('/settings/permissions')}
          />
          <SettingsRowSpacer />
          <SettingsRow
            icon={Database}
            iconColor={colors.accent.purple}
            iconBg="rgba(139, 92, 246, 0.14)"
            label="Data usage"
            description="See what account data is stored"
            onPress={() => Alert.alert('Data usage', 'A detailed breakdown will be available once this is connected to a backend.')}
          />
          <SettingsRowSpacer />
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
            label="Request account deletion"
            description="Ask support to remove your partner account"
            destructive
            onPress={requestAccountDeletion}
          />
        </GlassView>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginLeft: 4 }}>
          <AlertTriangle size={14} color={theme.textSecondary} style={{ marginTop: 2 }} />
          <Text className="text-caption" style={{ color: theme.textSecondary, flex: 1 }}>
            Once support confirms your request, you lose access to job history, earnings records and documents on file. Your account stays active until then.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
