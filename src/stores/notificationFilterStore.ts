import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface NotificationFilterState {
  /** Show only alerts that are still unread. Remembered across restarts. */
  unreadOnly: boolean;
  setUnreadOnly: (unreadOnly: boolean) => void;
}

export const useNotificationFilterStore = create<NotificationFilterState>()(
  persist(
    (set) => ({
      unreadOnly: false,
      setUnreadOnly: (unreadOnly) => set({ unreadOnly }),
    }),
    {
      name: 'fastermall-partner-notification-filter',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ unreadOnly: s.unreadOnly }),
    },
  ),
);
