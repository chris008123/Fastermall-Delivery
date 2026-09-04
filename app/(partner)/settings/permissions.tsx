import { Bell, Camera, HardDrive, MapPin, Navigation, Settings as SettingsIcon } from 'lucide-react-native';
import { Linking, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { BackButton } from '@/src/shared/components/BackButton';
import { GlassView } from '@/src/shared/components/GlassView';
import { SettingsRow, SettingsRowDivider } from '@/src/shared/components/SettingsRow';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useSettingsStore, type PermissionState, type PermissionStatus } from '@/src/stores/settingsStore';
import { colors } from '@/src/theme';

const STATUS_LABEL: Record<PermissionStatus, string> = {
  granted: 'Allowed',
  denied: 'Denied',
  not_determined: 'Not set',
};

const STATUS_COLOR: Record<PermissionStatus, string> = {
  granted: colors.semantic.success,
  denied: colors.semantic.error,
  not_determined: colors.semantic.warning,
};

const PERMISSION_ROWS: { key: keyof PermissionState; label: string; description: string; icon: typeof MapPin }[] = [
  { key: 'location', label: 'Location', description: 'Used to match you with nearby jobs', icon: MapPin },
  { key: 'backgroundLocation', label: 'Background location', description: 'Keeps tracking your route while the app is backgrounded', icon: Navigation },
  { key: 'notifications', label: 'Notifications', description: 'Job requests and account alerts', icon: Bell },
  { key: 'camera', label: 'Camera', description: 'Proof-of-delivery and document photos', icon: Camera },
  { key: 'storage', label: 'Storage / photos', description: 'Attaching existing photos to documents', icon: HardDrive },
];

// This app has no expo-location / expo-notifications / expo-camera
// dependency wired up yet, so statuses here reflect settingsStore's mocked
// permission state rather than the real OS permission APIs — a switch
// here can't actually flip an OS permission, so this shows status +
// a deep link into the device's own settings instead of a misleading toggle.
export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const permissions = useSettingsStore((s) => s.permissions);

  const openDeviceSettings = () => {
    Linking.openSettings().catch(() => {});
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 48, gap: 20 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>Location & permissions</Text>
      </View>

      <GlassView radius="card" style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
        {PERMISSION_ROWS.map(({ key, label, description, icon: Icon }, i) => (
          <View key={key}>
            <SettingsRow
              icon={Icon}
              iconColor={theme.textSecondary}
              iconBg={theme.surfaceRaised}
              label={label}
              description={description}
              right={
                <Text className="text-caption font-semibold" style={{ color: STATUS_COLOR[permissions[key]] }}>
                  {STATUS_LABEL[permissions[key]]}
                </Text>
              }
            />
            {i < PERMISSION_ROWS.length - 1 && <SettingsRowDivider />}
          </View>
        ))}
      </GlassView>

      <AnimatedPressable onPress={openDeviceSettings} scaleTo={0.98}>
        <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <SettingsIcon size={18} color={colors.partner.orange} />
          <Text className="text-body-lg font-semibold" style={{ color: colors.partner.orange }}>Open device settings</Text>
        </GlassView>
      </AnimatedPressable>

      <Text className="text-caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
        Permissions are controlled by your device's operating system. Use the button above to grant or revoke access from your device's own Settings app.
      </Text>
    </ScrollView>
  );
}
