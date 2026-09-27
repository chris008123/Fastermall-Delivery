import Constants from 'expo-constants';
import { FileText, Package, ScrollText } from 'lucide-react-native';
import { Alert, Linking, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/src/shared/components/BackButton';
import { GlassView } from '@/src/shared/components/GlassView';
import { SettingsRow, SettingsRowSpacer } from '@/src/shared/components/SettingsRow';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';

const LEGAL_BASE_URL = 'https://fastermall.com';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  const appName = Constants.expoConfig?.name ?? 'Fastermall Delivery';
  const version = Constants.expoConfig?.version ?? '\u2014';
  // Build numbers aren't set in app.json yet (no ios.buildNumber /
  // android.versionCode configured), so this falls back gracefully
  // instead of showing "undefined".
  const buildNumber =
    (Platform.OS === 'ios'
      ? Constants.expoConfig?.ios?.buildNumber
      : Constants.expoConfig?.android?.versionCode?.toString()) ?? 'Not set';

  const openLegal = (path: string) => {
    Linking.openURL(`${LEGAL_BASE_URL}${path}`).catch(() => {});
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 48, gap: 20 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>About</Text>
      </View>

      <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: colors.partner.orangeTint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Package size={28} color={colors.partner.orange} />
        </View>
        <Text className="text-h2 font-bold" style={{ color: theme.text }}>{appName}</Text>
        <Text className="text-caption" style={{ color: theme.textSecondary }}>
          {`Version ${version} \u00b7 Build ${buildNumber}`}
        </Text>
      </View>

      <GlassView radius="card" style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
        <SettingsRow
          icon={FileText}
          iconColor={colors.accent.blue}
          iconBg="rgba(59, 130, 196, 0.14)"
          label="Terms of service"
          onPress={() => openLegal('/terms')}
        />
        <SettingsRowSpacer />
        <SettingsRow
          icon={ScrollText}
          iconColor={colors.accent.blue}
          iconBg="rgba(59, 130, 196, 0.14)"
          label="Privacy policy"
          onPress={() => openLegal('/privacy')}
        />
        <SettingsRowSpacer />
        <SettingsRow
          icon={Package}
          iconColor={colors.brand.goldDark}
          iconBg={`${colors.brand.gold}26`}
          label="Open-source licenses"
          onPress={() =>
            Alert.alert('Open-source licenses', 'A full third-party license list will be generated as part of the release build pipeline.')
          }
        />
      </GlassView>

      <Text className="text-caption" style={{ color: theme.textSecondary, textAlign: 'center' }}>
        {`\u00a9 ${new Date().getFullYear()} Fastermall. All rights reserved.`}
      </Text>
    </ScrollView>
  );
}
