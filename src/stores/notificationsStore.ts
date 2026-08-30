import { create } from 'zustand';
import { initialNotifications } from '@/src/data/mockNotifications';
import type { AppNotification } from '@/src/types/notification';

interface NotificationsState {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markAllRead: () => void;
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
}));

export function selectUnreadCount(notifications: AppNotification[]) {
  return notifications.filter((n) => !n.read).length;
}
