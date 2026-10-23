import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface InteractionState {
  /** Small vibrations on key actions (going online, tab changes, accepting a job). */
  hapticsEnabled: boolean;
  setHapticsEnabled: (value: boolean) => void;
  /** Going offline takes a single tap instead of a slide. Going online
   * always takes a slide so it can't happen by accident. */
  offlineByTap: boolean;
  setOfflineByTap: (value: boolean) => void;
}

export const useInteractionStore = create<InteractionState>()(
  persist(
    (set) => ({
      hapticsEnabled: true,
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      offlineByTap: false,
      setOfflineByTap: (offlineByTap) => set({ offlineByTap }),
    }),
    {
      name: 'fastermall-partner-interaction',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ hapticsEnabled: s.hapticsEnabled, offlineByTap: s.offlineByTap }),
    },
  ),
);
