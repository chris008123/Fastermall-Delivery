import { Bell, Briefcase, Inbox, Megaphone, Vibrate, Volume2, Wallet } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, AppState, Linking, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/src/shared/components/BackButton';
import { Button } from '@/src/shared/components/Button';
import { fetchNotificationPrefs, saveNotificationPrefs } from '@/src/services/notificationPrefs';
import {
  getPushPermission,
  isPushAvailable,
  registerForPush,
  requestPushPermission,
  type PushPermission,
} from '@/src/services/push';
import { GlassView } from '@/src/shared/components/GlassView';
import { InactiveSettingNotice } from '@/src/shared/components/InactiveSettingNotice';
import { SettingsRow, SettingsRowSpacer } from '@/src/shared/components/SettingsRow';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useNotificationFilterStore } from '@/src/stores/notificationFilterStore';
import { useSettingsStore, type NotificationPrefs } from '@/src/stores/settingsStore';
import { colors } from '@/src/theme';

type Row = { key: keyof NotificationPrefs; label: string; description: string; icon: typeof Bell; iconColor: string; iconBg: string; protectedToggle?: boolean };

const JOB_ROWS: Row[] = [
  {
    key: 'newJobRequests',
    label: 'New job requests',
    description: 'Ping when a job becomes available nearby',
    icon: Briefcase,
    iconColor: colors.partner.orange,
    iconBg: colors.partner.orangeTint,
    protectedToggle: true,
  },
  {
    key: 'jobUpdates',
    label: 'Job updates',
    description: 'Status changes on jobs you\u2019re carrying',
    icon: Bell,
    iconColor: colors.brand.teal,
    iconBg: colors.brand.tealTint,
  },
];

const OTHER_ROWS: Row[] = [
  {
    key: 'payments',
    label: 'Payment notifications',
    description: 'Payouts and wallet activity',
    icon: Wallet,
    iconColor: colors.accent.green,
    iconBg: 'rgba(26, 156, 92, 0.14)',
  },
  {
    key: 'promotions',
    label: 'Promotions & announcements',
    description: 'Fastermall news and incentive campaigns (none are sent yet)',
    icon: Megaphone,
    iconColor: colors.accent.purple,
    iconBg: 'rgba(139, 92, 246, 0.14)',
  },
];

const ALERT_STYLE_ROWS: Row[] = [
  { key: 'sound', label: 'Sound', description: 'Play a sound for alerts', icon: Volume2, iconColor: colors.accent.blue, iconBg: 'rgba(59, 130, 196, 0.14)' },
  { key: 'vibration', label: 'Vibration', description: 'Vibrate for alerts while the app is open; your phone’s settings decide otherwise', icon: Vibrate, iconColor: colors.accent.blue, iconBg: 'rgba(59, 130, 196, 0.14)' },
];

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const prefs = useSettingsStore((s) => s.notificationPrefs);
  const setLocalPref = useSettingsStore((s) => s.setNotificationPref);
  const [permission, setPermission] = useState<PushPermission | null>(null);

  // The server decides which pushes to send, so its switches win. Read them
  // on open; the local copy keeps the screen usable offline.
  useEffect(() => {
    let alive = true;
    fetchNotificationPrefs()
      .then((server) => {
        if (!alive) return;
        for (const [k, v] of Object.entries(server) as [keyof NotificationPrefs, boolean][]) setLocalPref(k, v);
      })
      .catch(() => {});
    const readPermission = () => void getPushPermission().then((p) => alive && setPermission(p));
    readPermission();
    // Coming back from the phone's Settings app after allowing notifications.
    const sub = AppState.addEventListener('change', (s) => s === 'active' && readPermission());
    return () => {
      alive = false;
      sub.remove();
    };
  }, [setLocalPref]);

  // Saves to the server; on failure the switch goes back and the partner is told.
  const setPref = (key: keyof NotificationPrefs, value: boolean) => {
    const before = useSettingsStore.getState().notificationPrefs;
    setLocalPref(key, value);
    if (key === 'vibration') return; // phone-only
    saveNotificationPrefs({ ...before, [key]: value }).catch(() => {
      setLocalPref(key, before[key]);
      Alert.alert('Couldn’t save', 'Check your connection and try again.');
    });
  };

  const allowPush = async () => {
    if (permission === 'denied') {
      Linking.openSettings().catch(() => {});
      return;
    }
    const p = await requestPushPermission();
    setPermission(p);
    if (p === 'granted') void registerForPush();
  };
  // Same saved choice as the "Unread only" pill on the Notifications tab.
  const unreadOnly = useNotificationFilterStore((s) => s.unreadOnly);
  const setUnreadOnly = useNotificationFilterStore((s) => s.setUnreadOnly);

  // "New job requests" is the one alert a partner can't afford to miss —
  // rather than making it un-toggleable outright, turning it off asks for
  // an explicit confirmation instead of silently flipping the switch.
  const handleToggle = (row: Row, value: boolean) => {
    if (row.protectedToggle && !value) {
      Alert.alert(
        'Turn off new job requests?',
        'You won\u2019t be notified when new jobs become available nearby. You can still check the Jobs tab manually.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Turn off', style: 'destructive', onPress: () => setPref(row.key, value) },
        ],
      );
      return;
    }
    setPref(row.key, value);
  };

  const renderGroup = (rows: Row[]) => (
    <GlassView radius="card" style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
      {rows.map((row, i) => (
        <View key={row.key}>
          <SettingsRow
            icon={row.icon}
            iconColor={row.iconColor}
            iconBg={row.iconBg}
            label={row.label}
            description={row.description}
            right={
              <Switch accessibilityLabel={row.label}
                value={prefs[row.key]}
                onValueChange={(value) => handleToggle(row, value)}
                trackColor={{ false: theme.border, true: colors.partner.orangeTint }}
                thumbColor={prefs[row.key] ? colors.partner.orange : theme.surfaceRaised}
              />
            }
          />
          {i < rows.length - 1 && <SettingsRowSpacer />}
        </View>
      ))}
    </GlassView>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 48, gap: 20 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>Notifications</Text>
      </View>

      {!isPushAvailable() ? (
        <InactiveSettingNotice>
          This version of the app can’t receive push notifications. Update the app to get alerts on your lock screen. Everything still shows in the Notifications tab.
        </InactiveSettingNotice>
      ) : permission && permission !== 'granted' ? (
        <GlassView radius="card" style={{ padding: 16, gap: 10 }}>
          <Text className="text-body-lg font-semibold" style={{ color: theme.text }}>Notifications are off on this phone</Text>
          <Text className="text-body" style={{ color: theme.textSecondary }}>
            Allow them so new jobs and payments reach you even when the app is closed.
          </Text>
          <Button
            title={permission === 'denied' ? 'Open phone settings' : 'Allow notifications'}
            onPress={() => void allowPush()}
            fullWidth
          />
        </GlassView>
      ) : null}

      <View style={{ gap: 8 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8, marginLeft: 4 }}>
          JOBS
        </Text>
        {renderGroup(JOB_ROWS)}
      </View>

      <View style={{ gap: 8 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8, marginLeft: 4 }}>
          ACCOUNT
        </Text>
        {renderGroup(OTHER_ROWS)}
      </View>

      <View style={{ gap: 8 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8, marginLeft: 4 }}>
          ALERT STYLE
        </Text>
        {renderGroup(ALERT_STYLE_ROWS)}
      </View>

      <View style={{ gap: 8 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8, marginLeft: 4 }}>
          INBOX
        </Text>
      <GlassView radius="card" style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
          <SettingsRow
            icon={Inbox}
            iconColor={colors.accent.blue}
            iconBg="rgba(59, 130, 196, 0.14)"
            label="Unread only"
            description="Show only alerts you have not read yet in your Notifications list"
            right={
              <Switch accessibilityLabel="Unread only"
                value={unreadOnly}
                onValueChange={setUnreadOnly}
                trackColor={{ false: theme.border, true: colors.partner.orangeTint }}
                thumbColor={unreadOnly ? colors.partner.orange : theme.surfaceRaised}
              />
            }
          />
        </GlassView>
      </View>
    </ScrollView>
  );
}
