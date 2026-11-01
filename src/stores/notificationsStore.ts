import { create } from 'zustand';
import { apiFetch } from '@/src/services/api';
import type { AppNotification, NotificationType } from '@/src/types/notification';

interface BackendNotification {
  id: string;
  title: string;
  body: string;
  /** Free-form on the backend, e.g. DELIVERY_AVAILABLE, PAYMENT_SUCCESSFUL. */
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsState {
  notifications: AppNotification[];
  isLoading: boolean;
  error: string | null;
  /** Alerts the partner marked unread on this phone. The backend can only
   * mark read, so these are re-applied after every load. */
  locallyUnreadIds: string[];
  /** GET /notifications. */
  loadNotifications: () => Promise<void>;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markAllRead: () => void;
  /** Mark one alert read or unread, e.g. to keep an important one flagged. */
  setRead: (id: string, read: boolean) => void;
}

/** Collapses the backend's open-ended type strings onto the three icon
 * groups the app renders. */
function toAppType(type: string): NotificationType {
  const t = type.toUpperCase();
  if (t.includes('DELIVERY') || t.includes('JOB') || t.includes('ORDER')) return 'JOB';
  if (t.includes('PAYMENT') || t.includes('EARNING') || t.includes('PAYOUT')) return 'PAYMENT';
  return 'SYSTEM';
}

function unwrapList(value: unknown): BackendNotification[] {
  if (Array.isArray(value)) return value as BackendNotification[];
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: BackendNotification[] }).data;
  }
  return [];
}

/** Server-generated alerts have UUIDs; addNotification's local ones start
 * with "ntf-" and don't exist on the backend. */
function isServerId(id: string) {
  return !id.startsWith('ntf-');
}

function markReadOnServer(ids: string[]) {
  // Fire-and-forget: a failure only leaves that alert unread on the
  // server, and the next load shows it again.
  void Promise.allSettled(
    ids.filter(isServerId).map((id) => apiFetch(`/notifications/${id}/read`, { method: 'PATCH' })),
  );
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,
  locallyUnreadIds: [],

  loadNotifications: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiFetch<unknown>('/notifications');
      const locallyUnread = new Set(get().locallyUnreadIds);

      set({
        notifications: unwrapList(response).map((n) => ({
          id: n.id,
          type: toAppType(n.type ?? ''),
          title: n.title,
          body: n.body,
          createdAt: n.createdAt,
          read: locallyUnread.has(n.id) ? false : n.isRead,
        })),
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
    const unreadIds = get().notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      locallyUnreadIds: [],
    }));
    markReadOnServer(unreadIds);
  },

  setRead: (id, read) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read } : n)),
      locallyUnreadIds: read
        ? state.locallyUnreadIds.filter((x) => x !== id)
        : [...state.locallyUnreadIds.filter((x) => x !== id), id],
    }));
    if (read) markReadOnServer([id]);
  },
}));

export function selectUnreadCount(notifications: AppNotification[]) {
  return notifications.filter((n) => !n.read).length;
}
