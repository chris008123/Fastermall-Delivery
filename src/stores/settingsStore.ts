import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type NavigationApp = 'FASTERMALL_MAPS' | 'GOOGLE_MAPS' | 'WAZE';

interface SettingsState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  navigationApp: NavigationApp;
  setNavigationApp: (app: NavigationApp) => void;
}

// Kept as a plain in-memory zustand store (no persistence yet) — this is
// the frontend-only slice of the app, so nothing here needs to survive a
// reload until it's wired to real accounts.
export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  // Defaults to the built-in map since that's what every screen already
  // renders — switching to Google Maps/Waze hands off turn-by-turn to
  // the partner's preferred app instead.
  navigationApp: 'FASTERMALL_MAPS',
  setNavigationApp: (navigationApp) => set({ navigationApp }),
}));
