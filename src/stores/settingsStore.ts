import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

// Kept as a plain in-memory zustand store (no persistence yet) — this is
// the frontend-only slice of the app, so nothing here needs to survive a
// reload until it's wired to real accounts.
export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
}));
