import { Bell, BellOff, Briefcase, Wallet } from 'lucide-react-native';
import { useEffect } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from '@/src/shared/components/GlassView';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useNotificationsStore } from '@/src/stores/notificationsStore';
import { colors } from '@/src/theme';
import type { AppNotification, NotificationType } from '@/src/types/notification';

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  JOB: Briefcase,
  PAYMENT: Wallet,
  SYSTEM: Bell,
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  const notifications = useNotificationsStore((s) => s.notifications);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);

  // Mirrors the common inbox pattern: opening the list is itself the
  // "read" action, rather than requiring a separate tap per item.
  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  return (
    <FlatList<AppNotification>
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}
      data={notifications}
      keyExtractor={(n) => n.id}
      ListHeaderComponent={
        <Text className="text-h1 font-bold" style={{ color: theme.text, marginBottom: 4 }}>Notifications</Text>
      }
      ListEmptyComponent={
        <GlassView radius="card" style={{ padding: 20, alignItems: 'flex-start', gap: 8 }}>
          <BellOff size={20} color={theme.textSecondary} />
          <Text className="text-body" style={{ color: theme.textSecondary }}>Nothing here yet.</Text>
        </GlassView>
      }
      renderItem={({ item }) => <NotificationRow notification={item} theme={theme} />}
    />
  );
}

function NotificationRow({ notification, theme }: { notification: AppNotification; theme: { text: string; textSecondary: string } }) {
  const Icon = TYPE_ICON[notification.type];
  const accent = notification.type === 'PAYMENT' ? colors.partner.orange : notification.type === 'JOB' ? colors.brand.teal : theme.textSecondary;

  return (
    <GlassView radius="card" shadow={false} style={{ padding: 16, flexDirection: 'row', gap: 12, opacity: notification.read ? 0.75 : 1 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${accent}1a`,
        }}
      >
        <Icon size={16} color={accent} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text className="text-body-lg font-semibold" style={{ color: theme.text }}>{notification.title}</Text>
        <Text className="text-body" style={{ color: theme.textSecondary }}>{notification.body}</Text>
        <Text className="text-caption" style={{ color: theme.textSecondary, marginTop: 2 }}>
          {new Date(notification.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </Text>
      </View>
      {!notification.read && (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.partner.orange, marginTop: 4 }} />
      )}
    </GlassView>
  );
}
