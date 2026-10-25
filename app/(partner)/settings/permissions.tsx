import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, Settings as SettingsIcon } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { BackButton } from '@/src/shared/components/BackButton';
import { GlassView } from '@/src/shared/components/GlassView';
import { SettingsRow, SettingsRowSpacer } from '@/src/shared/components/SettingsRow';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';

type Status = 'granted' | 'denied' | 'undetermined' | 'checking';

const STATUS_LABEL: Record<Status, string> = {
  granted: 'Allowed',
  denied: 'Denied',
  undetermined: 'Not asked yet',
  checking: '…',
};

const STATUS_COLOR: Record<Status, string> = {
  granted: colors.semantic.success,
  denied: colors.semantic.error,
  undetermined: colors.semantic.warning,
  checking: colors.semantic.warning,
};

/** Reads what the phone says right now. Nothing here is stored or guessed. */
async function readStatuses(): Promise<{ camera: Status; photos: Status }> {
  const [camera, photos] = await Promise.all([
    ImagePicker.getCameraPermissionsAsync(),
    ImagePicker.getMediaLibraryPermissionsAsync(),
  ]);
  return { camera: camera.status as Status, photos: photos.status as Status };
}

// Only permissions this app really uses are listed, with their real status
// from the operating system. The app doesn't use location and doesn't send
// notifications yet, so there is nothing to show for them. Add the rows back
// when those features exist.
export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const [statuses, setStatuses] = useState<{ camera: Status; photos: Status }>({
    camera: 'checking',
    photos: 'checking',
  });

  const refresh = useCallback(() => {
    readStatuses()
      .then(setStatuses)
      .catch(() => setStatuses({ camera: 'undetermined', photos: 'undetermined' }));
  }, []);

  // Re-read when the screen opens and when the partner comes back from the
  // device's Settings app, where they may have changed something.
  useFocusEffect(refresh);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const rows = [
    {
      key: 'camera',
      label: 'Camera',
      description: 'Taking photos of your documents',
      icon: Camera,
      color: colors.accent.green,
      status: statuses.camera,
    },
    {
      key: 'photos',
      label: 'Photos',
      description: 'Choosing existing photos for your documents',
      icon: ImageIcon,
      color: colors.brand.goldDark,
      status: statuses.photos,
    },
  ] as const;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 48, gap: 20 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>Permissions</Text>
      </View>

      <GlassView radius="card" style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
        {rows.map(({ key, label, description, icon: Icon, color, status }, i) => (
          <View key={key}>
            <SettingsRow
              icon={Icon}
              iconColor={color}
              iconBg={`${color}22`}
              label={label}
              description={description}
              right={
                <Text className="text-caption font-semibold" style={{ color: STATUS_COLOR[status] }}>
                  {STATUS_LABEL[status]}
                </Text>
              }
            />
            {i < rows.length - 1 && <SettingsRowSpacer />}
          </View>
        ))}
      </GlassView>

      <AnimatedPressable
        onPress={() => Linking.openSettings().catch(() => {})}
        scaleTo={0.98}
        accessibilityRole="button"
        accessibilityLabel="Open device settings"
      >
        <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <SettingsIcon size={18} color={colors.partner.orange} />
          <Text className="text-body-lg font-semibold" style={{ color: colors.partner.orange }}>Open device settings</Text>
        </GlassView>
      </AnimatedPressable>

      <Text className="text-caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
        The statuses above come straight from your phone. Fastermall Partner doesn&apos;t use your location and doesn&apos;t send notifications yet, so there is nothing to allow for those. Change a permission from your phone&apos;s own Settings app.
      </Text>
    </ScrollView>
  );
}
