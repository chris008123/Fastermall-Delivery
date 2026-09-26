import { Bell, BellOff, Briefcase, Wallet } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { SectionList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from '@/src/shared/components/GlassView';
import { NAV_BAR_CLEARANCE } from '@/src/shared/components/FloatingNav';
import { SwipeableRow } from '@/src/shared/components/SwipeableRow';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useNotificationsStore } from '@/src/stores/notificationsStore';
import { colors } from '@/src/theme';
import type { AppNotification, NotificationType } from '@/src/types/notification';

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  JOB: Briefcase,
  PAYMENT: Wallet,
  SYSTEM: Bell,
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Presentation-only grouping over whatever the store already holds — no
// store changes. Per the redesign brief: "grouped by recency".
function groupByRecency(notifications: AppNotification[]) {
  const today: AppNotification[] = [];
  const thisWeek: AppNotification[] = [];
  const earlier: AppNotification[] = [];
  const todayKey = new Date().toDateString();
  const weekAgo = Date.now() - 7 * DAY_MS;

  for (const n of notifications) {
    const created = new Date(n.createdAt);
    if (created.toDateString() === todayKey) today.push(n);
    else if (created.getTime() >= weekAgo) thisWeek.push(n);
    else earlier.push(n);
  }

  return [
    { title: 'Today', data: today },
    { title: 'This week', data: thisWeek },
    { title: 'Earlier', data: earlier },
  ].filter((section) => section.data.length > 0);
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  const notifications = useNotificationsStore((s) => s.notifications);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);

  // Client-side-only hide list, not a store mutation — swiping a
  // notification away hides it for this session without touching the
  // underlying notifications data.
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Mirrors the common inbox pattern: opening the list is itself the
  // "read" action, rather than requiring a separate tap per item.
  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  const visible = notifications.filter((n) => !dismissedIds.has(n.id));
  const sections = groupByRecency(visible);

  return (
    <SectionList<AppNotification>
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: insets.bottom + NAV_BAR_CLEARANCE, gap: 10 }}
      sections={sections}
      keyExtractor={(n) => n.id}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <Text className="text-h1 font-bold" style={{ color: theme.text, marginBottom: 4 }}>Notifications</Text>
      }
      ListEmptyComponent={
        <GlassView radius="card" style={{ padding: 20, alignItems: 'flex-start', gap: 8 }}>
          <BellOff size={20} color={theme.textSecondary} />
          <Text className="text-body" style={{ color: theme.textSecondary }}>Nothing here yet.</Text>
        </GlassView>
      }
      renderSectionHeader={({ section }) => (
        <Text
          className="text-overline font-semibold"
          style={{ color: theme.textSecondary, letterSpacing: 0.8, marginTop: 8, marginBottom: 6 }}
        >
          {section.title.toUpperCase()}
        </Text>
      )}
      renderItem={({ item }) => (
        <SwipeableRow onDismiss={() => setDismissedIds((prev) => new Set(prev).add(item.id))}>
          <View style={{ marginBottom: 10 }}>
            <NotificationRow notification={item} theme={theme} />
          </View>
        </SwipeableRow>
      )}
    />
  );
}

function NotificationRow({ notification, theme }: { notification: AppNotification; theme: { text: string; textSecondary: string } }) {
  const Icon = TYPE_ICON[notification.type];
  const accent = notification.type === 'PAYMENT' ? colors.partner.orange : notification.type === 'JOB' ? colors.brand.teal : theme.textSecondary;

  return (
    <GlassView radius="card" shadow={false} style={{ padding: 0, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row' }}>
        {/* Unread reads as a subtle left accent, not a loud dot — per the
            redesign brief's explicit "not a loud dot flood" note. */}
        <View style={{ width: notification.read ? 0 : 3, backgroundColor: colors.partner.orange }} />
        <View style={{ flex: 1, flexDirection: 'row', gap: 12, padding: 16, opacity: notification.read ? 0.75 : 1 }}>
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
        </View>
      </View>
    </GlassView>
  );
}
