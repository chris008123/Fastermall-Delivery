import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type NavStyle = 'docked' | 'compact' | 'floating';
/** Where the floating bar sits horizontally. Lets left-handed riders keep it under their thumb. */
export type NavAlign = 'start' | 'center' | 'end';

interface NavStyleState {
  navStyle: NavStyle;
  setNavStyle: (navStyle: NavStyle) => void;
  navAlign: NavAlign;
  setNavAlign: (navAlign: NavAlign) => void;
}

// Kept separate from settingsStore (which is in-memory only) so this one
// preference survives app restarts without changing how the rest of the
// settings behave.
export const useNavStyleStore = create<NavStyleState>()(
  persist(
    (set) => ({
      navStyle: 'docked',
      setNavStyle: (navStyle) => set({ navStyle }),
      navAlign: 'center',
      setNavAlign: (navAlign) => set({ navAlign }),
    }),
    {
      name: 'fastermall-partner-nav-style',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ navStyle: state.navStyle, navAlign: state.navAlign }),
    },
  ),
);
