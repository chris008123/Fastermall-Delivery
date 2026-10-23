import { Bell, Briefcase, Wallet } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { SectionList, View } from 'react-native';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import { SwipeableRow } from '@/src/shared/components/SwipeableRow';
import { useNotificationsStore } from '@/src/stores/notificationsStore';
import type { AppNotification, NotificationType } from '@/src/types/notification';
import { useNavClearance } from '@/src/ui/AppNav';
import { Panel } from '@/src/ui/Panel';
import { ScreenHeader } from '@/src/ui/ScreenHeader';

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  JOB: Briefcase,
  PAYMENT: Wallet,
  SYSTEM: Bell,
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Presentation-only grouping over whatever the store already holds — no
// store changes. Grouped by recency.
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
  const { t } = useTheme();
  const navClearance = useNavClearance();

  const notifications = useNotificationsStore((s) => s.notifications);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);

  // What was unread when this screen opened. Opening the list marks
  // everything read, so without this the unread edge would vanish the
  // instant you arrived instead of showing you what's new.
  const [unreadAtOpen] = useState(
    () => new Set(useNotificationsStore.getState().notifications.filter((n) => !n.read).map((n) => n.id)),
  );

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
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader title="Alerts" subtitle={sections.length > 0 ? 'Swipe left to dismiss' : undefined} />
      <SectionList<AppNotification>
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: navClearance }}
        sections={sections}
        keyExtractor={(n) => n.id}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <Panel style={{ gap: 4 }}>
            <Txt variant="heading">You're all caught up</Txt>
            <Txt variant="body" tone="secondary">
              Job requests, payment updates and account notices will show up here.
            </Txt>
          </Panel>
        }
        renderSectionHeader={({ section }) => (
          <Txt variant="label" tone="secondary" style={{ marginTop: 12, marginBottom: 8 }}>
            {section.title}
          </Txt>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <SwipeableRow onDismiss={() => setDismissedIds((prev) => new Set(prev).add(item.id))}>
            <NotificationRow notification={item} unread={unreadAtOpen.has(item.id)} />
          </SwipeableRow>
        )}
      />
    </View>
  );
}

function NotificationRow({ notification, unread }: { notification: AppNotification; unread: boolean }) {
  const { t } = useTheme();
  const Icon = TYPE_ICON[notification.type];
  const accent =
    notification.type === 'PAYMENT' ? t.goInk : notification.type === 'JOB' ? t.primary : t.inkSecondary;

  return (
    <Panel padding={0} style={{ overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row' }}>
        {/* Unread is a quiet left edge, not a loud dot. */}
        <View style={{ width: unread ? 3 : 0, backgroundColor: t.primary }} />
        <View style={{ flex: 1, flexDirection: 'row', gap: 12, padding: 16 }}>
          <Icon size={20} color={accent} style={{ marginTop: 2 }} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="bodyStrong">{notification.title}</Txt>
            <Txt variant="body" tone="secondary">
              {notification.body}
            </Txt>
            <Txt variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
              {new Date(notification.createdAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Txt>
          </View>
        </View>
      </View>
    </Panel>
  );
}
