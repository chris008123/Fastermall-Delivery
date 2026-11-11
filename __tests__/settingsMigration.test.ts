/* eslint-disable import/first -- jest.mock() must come before the imports it replaces */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { migrateSettings, useSettingsStore } from '@/src/stores/settingsStore';

describe('settings: navigation app', () => {
  it('defaults to Google Maps now that there is no built-in map', () => {
    expect(useSettingsStore.getInitialState().navigationApp).toBe('GOOGLE_MAPS');
  });

  it('moves a saved Fastermall Maps choice to Google Maps', () => {
    const out = migrateSettings({ theme: 'dark', navigationApp: 'FASTERMALL_MAPS' }, 1);
    expect(out).toEqual({ theme: 'dark', navigationApp: 'GOOGLE_MAPS' });
  });

  it('keeps a saved Waze choice', () => {
    const saved = { navigationApp: 'WAZE' };
    expect(migrateSettings(saved, 1)).toBe(saved);
  });

  it('leaves current settings alone', () => {
    const saved = { navigationApp: 'WAZE' };
    expect(migrateSettings(saved, 2)).toBe(saved);
  });
});
