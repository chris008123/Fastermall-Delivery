import { router } from 'expo-router';
import { Bell, BellOff, Briefcase, ChevronRight, Wallet } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { SectionList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { GlassView } from '@/src/shared/components/GlassView';
import { useNavClearance } from '@/src/shared/components/AppNav';
import { SwipeableRow } from '@/src/shared/components/SwipeableRow';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useToast } from '@/src/shared/toast/ToastProvider';
import { haptics } from '@/src/shared/utils/haptics';
import { useNotificationFilterStore } from '@/src/stores/notificationFilterStore';
import { useNotificationsStore } from '@/src/stores/notificationsStore';
import { colors } from '@/src/theme';
import type { AppNotification, NotificationType } from '@/src/types/notification';

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  JOB: Briefcase,
  PAYMENT: Wallet,
  SYSTEM: Bell,
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Where tapping an alert goes: jobs and payments open their tab; system
 * notices have nowhere to go unless they carry their own link. */
function targetFor(n: AppNotification): string | undefined {
  if (n.href) return n.href;
  if (n.type === 'JOB') return '/(partner)/jobs';
  if (n.type === 'PAYMENT') return '/(partner)/wallet';
  return undefined;
}

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
  const navClearance = useNavClearance();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  const notifications = useNotificationsStore((s) => s.notifications);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const setRead = useNotificationsStore((s) => s.setRead);
  const { show } = useToast();

  // What was unread when this screen opened. Opening the list marks
  // everything read, so without this the unread edge would vanish the
  // instant you arrived instead of showing you what's new.
  const [unreadAtOpen] = useState(
    () => new Set(useNotificationsStore.getState().notifications.filter((n) => !n.read).map((n) => n.id)),
  );
  // Alerts the partner flipped read/unread during this visit.
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const unreadOnly = useNotificationFilterStore((s) => s.unreadOnly);
  const setUnreadOnly = useNotificationFilterStore((s) => s.setUnreadOnly);

  // Client-side-only hide list, not a store mutation — swiping a
  // notification away hides it for this session without touching the
  // underlying notifications data.
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Mirrors the common inbox pattern: opening the list is itself the
  // "read" action, rather than requiring a separate tap per item.
  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  const isUnread = (id: string) => (unreadAtOpen.has(id) ? !flaggedIds.has(id) : flaggedIds.has(id));

  const undoDismiss = (ids: string[]) =>
    setDismissedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });

  const dismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
    show('Alert dismissed', 'info', { action: { label: 'Undo', onPress: () => undoDismiss([id]) } });
  };

  // Sets an explicit state instead of flipping the current one, so the Undo
  // on the toast can't act on a stale closure and flip it the wrong way.
  const applyUnread = (id: string, makeUnread: boolean) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (makeUnread !== unreadAtOpen.has(id)) next.add(id);
      else next.delete(id);
      return next;
    });
    setRead(id, !makeUnread);
  };

  const toggleUnread = (id: string) => {
    const makeUnread = !isUnread(id);
    haptics.light();
    applyUnread(id, makeUnread);
    show(makeUnread ? 'Marked as unread' : 'Marked as read', 'info', {
      action: { label: 'Undo', onPress: () => applyUnread(id, !makeUnread) },
    });
  };

  const notDismissed = notifications.filter((n) => !dismissedIds.has(n.id));
  const unreadCount = notDismissed.filter((n) => isUnread(n.id)).length;
  const visible = unreadOnly ? notDismissed.filter((n) => isUnread(n.id)) : notDismissed;
  const sections = groupByRecency(visible);

  const clearAll = () => {
    const ids = visible.map((n) => n.id);
    if (ids.length === 0) return;
    setDismissedIds((prev) => new Set([...prev, ...ids]));
    show(ids.length === 1 ? 'Alert cleared' : `${ids.length} alerts cleared`, 'info', {
      action: { label: 'Undo', onPress: () => undoDismiss(ids) },
    });
  };

  return (
    <SectionList<AppNotification>
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: navClearance, gap: 10 }}
      sections={sections}
      keyExtractor={(n) => n.id}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={{ marginBottom: 4, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text className="text-h1 font-bold" style={{ color: theme.text }}>Notifications</Text>
            {visible.length > 0 ? (
              <AnimatedPressable
                onPress={clearAll}
                scaleTo={0.95}
                accessibilityRole="button"
                accessibilityLabel="Clear all notifications"
                hitSlop={10}
              >
                <Text className="text-caption font-semibold" style={{ color: colors.partner.orange }}>Clear all</Text>
              </AnimatedPressable>
            ) : null}
          </View>
          {visible.length > 0 ? (
            <Text className="text-caption" style={{ color: theme.textSecondary }}>
              Swipe left to dismiss. Hold to mark as unread.
            </Text>
          ) : null}
          {notDismissed.length > 0 ? (
            <AnimatedPressable
              onPress={() => {
                haptics.light();
                setUnreadOnly(!unreadOnly);
              }}
              scaleTo={0.96}
              accessibilityRole="switch"
              accessibilityState={{ checked: unreadOnly }}
              accessibilityLabel="Unread only"
              style={{ alignSelf: 'flex-start', marginTop: 8 }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: unreadOnly ? colors.partner.orange : theme.border,
                  backgroundColor: unreadOnly ? colors.partner.orangeTint : 'transparent',
                }}
              >
                <Text
                  className="text-caption font-semibold"
                  style={{ color: unreadOnly ? colors.partner.orange : theme.textSecondary }}
                >
                  {unreadCount > 0 ? `Unread only · ${unreadCount}` : 'Unread only'}
                </Text>
              </View>
            </AnimatedPressable>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <GlassView radius="card" style={{ padding: 20, alignItems: 'flex-start', gap: 8 }}>
          <BellOff size={20} color={theme.textSecondary} />
          <Text className="text-body" style={{ color: theme.textSecondary }}>
            {unreadOnly && notDismissed.length > 0 ? "You're all caught up." : 'Nothing here yet.'}
          </Text>
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
      renderItem={({ item }) => {
        const target = targetFor(item);
        const open = target ? () => router.push(target as never) : undefined;
        const unread = isUnread(item.id);
        return (
          <View style={{ marginBottom: 10 }}>
            <SwipeableRow
              onDismiss={() => dismiss(item.id)}
              onActivate={open}
              extraActions={[
                { name: 'toggleUnread', label: unread ? 'Mark as read' : 'Mark as unread', onPress: () => toggleUnread(item.id) },
              ]}
            >
              <NotificationRow
                notification={item}
                theme={theme}
                unread={unread}
                onPress={open}
                onLongPress={() => toggleUnread(item.id)}
              />
            </SwipeableRow>
          </View>
        );
      }}
    />
  );
}

function NotificationRow({
  notification,
  theme,
  unread,
  onPress,
  onLongPress,
}: {
  notification: AppNotification;
  theme: { text: string; textSecondary: string };
  unread: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const Icon = TYPE_ICON[notification.type];
  const accent = notification.type === 'PAYMENT' ? colors.partner.orange : notification.type === 'JOB' ? colors.brand.teal : theme.textSecondary;

  return (
    <AnimatedPressable onPress={onPress} onLongPress={onLongPress} scaleTo={0.98} accessibilityLabel={notification.title}>
    <GlassView radius="card" shadow={false} style={{ padding: 0, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row' }}>
        {/* Unread reads as a subtle left accent, not a loud dot — per the
            redesign brief's explicit "not a loud dot flood" note. */}
        <View style={{ width: unread ? 3 : 0, backgroundColor: colors.partner.orange }} />
        <View style={{ flex: 1, flexDirection: 'row', gap: 12, padding: 16, opacity: unread ? 1 : 0.75 }}>
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
          {onPress ? <ChevronRight size={18} color={theme.textSecondary} style={{ alignSelf: 'center' }} /> : null}
        </View>
      </View>
    </GlassView>
    </AnimatedPressable>
  );
}
