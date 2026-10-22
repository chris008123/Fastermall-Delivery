import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type NavStyle = 'docked' | 'compact' | 'floating';

interface NavStyleState {
  navStyle: NavStyle;
  setNavStyle: (navStyle: NavStyle) => void;
}

// Kept separate from settingsStore (which is in-memory only) so this one
// preference survives app restarts without changing how the rest of the
// settings behave.
export const useNavStyleStore = create<NavStyleState>()(
  persist(
    (set) => ({
      navStyle: 'docked',
      setNavStyle: (navStyle) => set({ navStyle }),
    }),
    {
      name: 'fastermall-partner-nav-style',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ navStyle: state.navStyle }),
    },
  ),
);
