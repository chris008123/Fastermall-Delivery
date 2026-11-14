import { create } from 'zustand';
import { apiFetch } from '@/src/services/api';
import { notificationRoute } from '@/src/utils/notificationRoute';
import type { AppNotification, NotificationType } from '@/src/types/notification';

interface BackendNotification {
  id: string;
  title: string;
  body: string;
  /** Free-form on the backend, e.g. DELIVERY_AVAILABLE, CASHOUT_PAID. */
  type: string;
  /** jobId / deliveryId / ticketId / payoutId…: what the alert is about. */
  data?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

/** How long a dismissed alert can be brought back with Undo before it is deleted on the server. */
export const UNDO_WINDOW_MS = 5000;

/** Alerts per request. */
export const PAGE_SIZE = 30;

interface NotificationsState {
  notifications: AppNotification[];
  isLoading: boolean;
  error: string | null;
  /** Where the next page of older alerts starts; null once all are loaded. */
  nextCursor: string | null;
  isLoadingMore: boolean;
  /** Unread alerts on pages not loaded yet (from GET /notifications/unread-count), for the badge. */
  olderUnread: number;
  /** GET /notifications: the newest page, plus the unread count. */
  loadNotifications: () => Promise<void>;
  /** The next page of older alerts, appended. */
  loadMore: () => Promise<void>;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  /** PATCH /notifications/read-all, in one request. */
  markAllRead: () => void;
  /** Mark one alert read or unread (PATCH /notifications/:id), e.g. to keep an important one flagged. */
  setRead: (id: string, read: boolean) => void;
  /** Removes alerts now and deletes them on the server once UNDO_WINDOW_MS has passed. */
  dismiss: (ids: string[]) => void;
  /** Brings back alerts dismissed less than UNDO_WINDOW_MS ago. */
  undoDismiss: (ids: string[]) => void;
}

/** Collapses the backend's open-ended type strings onto the three icon groups the app renders. Exported for tests. */
export function toAppType(type: string): NotificationType {
  const t = type.toUpperCase();
  if (t.includes('DELIVERY') || t.includes('JOB') || t.includes('ORDER')) return 'JOB';
  if (/PAYMENT|EARNING|PAYOUT|CASHOUT/.test(t)) return 'PAYMENT';
  return 'SYSTEM';
}

type Page = { items: BackendNotification[]; nextCursor: string | null };

/** Accepts { items, nextCursor }, a plain array (older server), each bare or wrapped in { data }. */
function unwrapPage(value: unknown): Page {
  const body = value && typeof value === 'object' && 'data' in (value as object) ? (value as { data: unknown }).data : value;
  if (Array.isArray(body)) return { items: body as BackendNotification[], nextCursor: null };
  if (body && typeof body === 'object' && Array.isArray((body as Page).items)) {
    return { items: (body as Page).items, nextCursor: (body as Page).nextCursor ?? null };
  }
  return { items: [], nextCursor: null };
}

function unwrapCount(value: unknown): number | null {
  const body = value && typeof value === 'object' && 'data' in (value as object) ? (value as { data: unknown }).data : value;
  const n = Number((body as { unread?: unknown } | null)?.unread);
  return Number.isFinite(n) ? n : null;
}

const pagePath = (cursor?: string) =>
  `/notifications?limit=${PAGE_SIZE}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;

const unreadIn = (list: AppNotification[]) => list.filter((n) => !n.read).length;

/** Exported for tests. */
export function toAppNotification(n: BackendNotification): AppNotification {
  const type = n.type ?? '';
  return {
    id: n.id,
    type: toAppType(type),
    title: n.title,
    body: n.body,
    createdAt: n.createdAt,
    read: n.isRead,
    // The same place the push for this alert opens.
    href: notificationRoute({ ...(n.data ?? {}), type }) ?? undefined,
  };
}

/** Server-generated alerts have UUIDs; addNotification's local ones start
 * with "ntf-" and don't exist on the backend. */
function isServerId(id: string) {
  return !id.startsWith('ntf-');
}

// Fire-and-forget: a failure only leaves that change undone on the server,
// and the next load shows the server's state again.
const quietly = (p: Promise<unknown>) => void p.catch(() => undefined);

// Dismissed alerts waiting out the Undo window: id -> { the alert, its timer }.
const pendingDeletes = new Map<string, { item: AppNotification; index: number; timer: ReturnType<typeof setTimeout> }>();

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,
  nextCursor: null,
  isLoadingMore: false,
  olderUnread: 0,

  loadNotifications: async () => {
    set({ isLoading: true, error: null });

    try {
      const [response, count] = await Promise.all([
        apiFetch<unknown>(pagePath()),
        apiFetch<unknown>('/notifications/unread-count').catch(() => null),
      ]);
      const page = unwrapPage(response);
      // Alerts still inside their Undo window stay hidden.
      const notifications = page.items.filter((n) => !pendingDeletes.has(n.id)).map(toAppNotification);
      const total = unwrapCount(count);
      set({
        notifications,
        nextCursor: page.nextCursor,
        olderUnread: total === null ? 0 : Math.max(0, total - unreadIn(notifications)),
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load notifications.',
      });
    }
  },

  loadMore: async () => {
    const { nextCursor, isLoadingMore } = get();
    if (!nextCursor || isLoadingMore) return;
    set({ isLoadingMore: true });
    try {
      const page = unwrapPage(await apiFetch<unknown>(pagePath(nextCursor)));
      const have = new Set(get().notifications.map((n) => n.id));
      const older = page.items
        .filter((n) => !have.has(n.id) && !pendingDeletes.has(n.id))
        .map(toAppNotification);
      set((state) => ({
        notifications: [...state.notifications, ...older],
        nextCursor: page.nextCursor,
        // Those unread ones are now counted from the list itself.
        olderUnread: page.nextCursor ? Math.max(0, state.olderUnread - unreadIn(older)) : 0,
        isLoadingMore: false,
      }));
    } catch {
      set({ isLoadingMore: false });
    }
  },

  addNotification: (n) =>
    set((state) => ({
      notifications: [
        { ...n, id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString(), read: false },
        ...state.notifications,
      ],
    })),

  markAllRead: () => {
    const unread = get().notifications.filter((n) => !n.read);
    const olderUnread = get().olderUnread;
    if (unread.length === 0 && olderUnread === 0) return;

    set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })), olderUnread: 0 }));
    if (olderUnread > 0 || unread.some((n) => isServerId(n.id))) {
      quietly(apiFetch('/notifications/read-all', { method: 'PATCH' }));
    }
  },

  setRead: (id, read) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read } : n)),
    }));
    if (!isServerId(id)) return;
    quietly(
      apiFetch(`/notifications/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ isRead: read }),
      }),
    );
  },

  dismiss: (ids) => {
    const list = get().notifications;
    const wanted = new Set(ids);
    list.forEach((item, index) => {
      if (!wanted.has(item.id) || pendingDeletes.has(item.id)) return;
      const timer = setTimeout(() => {
        pendingDeletes.delete(item.id);
        if (isServerId(item.id)) {
          quietly(apiFetch(`/notifications/${encodeURIComponent(item.id)}`, { method: 'DELETE' }));
        }
      }, UNDO_WINDOW_MS);
      pendingDeletes.set(item.id, { item, index, timer });
    });
    set({ notifications: list.filter((n) => !wanted.has(n.id)) });
  },

  undoDismiss: (ids) => {
    const restored: { item: AppNotification; index: number }[] = [];
    for (const id of ids) {
      const pending = pendingDeletes.get(id);
      if (!pending) continue;
      clearTimeout(pending.timer);
      pendingDeletes.delete(id);
      restored.push(pending);
    }
    if (restored.length === 0) return;
    set((state) => {
      const next = [...state.notifications];
      // Back where they were, lowest position first.
      for (const { item, index } of restored.sort((a, b) => a.index - b.index)) {
        next.splice(Math.min(index, next.length), 0, item);
      }
      return { notifications: next };
    });
  },
}));

/** Unread alerts for the badge: the loaded ones plus those on pages not loaded yet. */
export function selectUnreadCount(state: { notifications: AppNotification[]; olderUnread: number }) {
  return unreadIn(state.notifications) + state.olderUnread;
}
