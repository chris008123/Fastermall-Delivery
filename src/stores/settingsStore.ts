import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type NavigationApp = 'FASTERMALL_MAPS' | 'GOOGLE_MAPS' | 'WAZE';
export type PermissionStatus = 'granted' | 'denied' | 'not_determined';
export type JobCategory = 'MARKETPLACE' | 'FOOD' | 'LAUNDRY';

export interface NavigationPrefs {
  avoidTolls: boolean;
  avoidHighways: boolean;
  voiceNavigation: boolean;
  autoOpenNavigation: boolean;
}

export interface NotificationPrefs {
  newJobRequests: boolean;
  jobUpdates: boolean;
  payments: boolean;
  promotions: boolean;
  sound: boolean;
  vibration: boolean;
}

export interface DeliveryPrefs {
  autoAccept: boolean;
  radiusKm: number;
  maxDistanceKm: number;
  categories: JobCategory[];
}

export interface PermissionState {
  location: PermissionStatus;
  backgroundLocation: PermissionStatus;
  notifications: PermissionStatus;
  camera: PermissionStatus;
  storage: PermissionStatus;
}

interface SettingsState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  navigationApp: NavigationApp;
  setNavigationApp: (app: NavigationApp) => void;
  navigationPrefs: NavigationPrefs;
  setNavigationPref: <K extends keyof NavigationPrefs>(key: K, value: NavigationPrefs[K]) => void;

  notificationPrefs: NotificationPrefs;
  setNotificationPref: <K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) => void;

  deliveryPrefs: DeliveryPrefs;
  setDeliveryPref: <K extends keyof DeliveryPrefs>(key: K, value: DeliveryPrefs[K]) => void;
  toggleDeliveryCategory: (category: JobCategory) => void;

  permissions: PermissionState;
  setPermission: (key: keyof PermissionState, status: PermissionStatus) => void;

  twoFactorEnabled: boolean;
  setTwoFactorEnabled: (enabled: boolean) => void;
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

  navigationPrefs: {
    avoidTolls: false,
    avoidHighways: false,
    voiceNavigation: true,
    autoOpenNavigation: false,
  },
  setNavigationPref: (key, value) =>
    set((s) => ({ navigationPrefs: { ...s.navigationPrefs, [key]: value } })),

  // newJobRequests defaults on and is treated as protected in the UI
  // (settings/notifications.tsx warns instead of silently allowing it
  // off) since missing a job ping is the one notification a partner
  // can't afford to silence.
  notificationPrefs: {
    newJobRequests: true,
    jobUpdates: true,
    payments: true,
    promotions: false,
    sound: true,
    vibration: true,
  },
  setNotificationPref: (key, value) =>
    set((s) => ({ notificationPrefs: { ...s.notificationPrefs, [key]: value } })),

  deliveryPrefs: {
    autoAccept: false,
    radiusKm: 5,
    maxDistanceKm: 15,
    categories: ['FOOD'],
  },
  setDeliveryPref: (key, value) =>
    set((s) => ({ deliveryPrefs: { ...s.deliveryPrefs, [key]: value } })),
  toggleDeliveryCategory: (category) =>
    set((s) => {
      const has = s.deliveryPrefs.categories.includes(category);
      // Guard against zeroing out every category — a partner offline for
      // all three job types is functionally the same as going fully
      // offline, which is a separate control (Home screen's availability
      // switch), not something this toggle should do as a side effect.
      if (has && s.deliveryPrefs.categories.length === 1) return s;
      const categories = has
        ? s.deliveryPrefs.categories.filter((c) => c !== category)
        : [...s.deliveryPrefs.categories, category];
      return { deliveryPrefs: { ...s.deliveryPrefs, categories } };
    }),

  // Mocked statuses — this app has no expo-location / expo-notifications /
  // expo-camera dependency yet, so these reflect UI state only, matching
  // the rest of this frontend-only settings slice. Wiring to the real OS
  // permission APIs is a follow-up native-module task.
  permissions: {
    location: 'granted',
    backgroundLocation: 'denied',
    notifications: 'granted',
    camera: 'granted',
    storage: 'not_determined',
  },
  setPermission: (key, status) =>
    set((s) => ({ permissions: { ...s.permissions, [key]: status } })),

  twoFactorEnabled: false,
  setTwoFactorEnabled: (twoFactorEnabled) => set({ twoFactorEnabled }),
}));
