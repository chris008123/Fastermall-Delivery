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

interface NotificationsState {
  notifications: AppNotification[];
  isLoading: boolean;
  error: string | null;
  /** GET /notifications. */
  loadNotifications: () => Promise<void>;
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

function unwrapList(value: unknown): BackendNotification[] {
  if (Array.isArray(value)) return value as BackendNotification[];
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: BackendNotification[] }).data;
  }
  return [];
}

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

  loadNotifications: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiFetch<unknown>('/notifications');
      set({
        // Alerts still inside their Undo window stay hidden.
        notifications: unwrapList(response)
          .filter((n) => !pendingDeletes.has(n.id))
          .map(toAppNotification),
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load notifications.',
      });
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
    if (unread.length === 0) return;

    set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) }));
    if (unread.some((n) => isServerId(n.id))) {
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

export function selectUnreadCount(notifications: AppNotification[]) {
  return notifications.filter((n) => !n.read).length;
}
