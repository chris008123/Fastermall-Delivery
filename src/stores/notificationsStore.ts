import { create } from 'zustand';
import { initialNotifications } from '@/src/data/mockNotifications';
import type { AppNotification } from '@/src/types/notification';

interface NotificationsState {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markAllRead: () => void;
  /** Mark one alert read or unread, e.g. to keep an important one flagged. */
  setRead: (id: string, read: boolean) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: initialNotifications,

  addNotification: (n) =>
    set((state) => ({
      notifications: [
        { ...n, id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString(), read: false },
        ...state.notifications,
      ],
    })),

  markAllRead: () =>
    set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) })),

  setRead: (id, read) =>
    set((state) => ({ notifications: state.notifications.map((n) => (n.id === id ? { ...n, read } : n)) })),
}));

export function selectUnreadCount(notifications: AppNotification[]) {
  return notifications.filter((n) => !n.read).length;
}
