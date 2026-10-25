import AsyncStorage from '@react-native-async-storage/async-storage';

import { useLocalStageStore } from '@/src/stores/localStageStore';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { resetAccountData } from '@/src/stores/sessionReset';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock('@/src/services/api', () => ({
  ...jest.requireActual('@/src/services/api'),
  apiFetch: jest.fn(),
}));

const stored = async (key: string) => JSON.parse((await AsyncStorage.getItem(key)) ?? 'null');

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('settings', () => {
  it('are saved on the phone so they survive closing the app', async () => {
    useSettingsStore.getState().setTheme('light');
    useSettingsStore.getState().setNotificationPref('promotions', true);

    const saved = await stored('fastermall-partner-settings');
    expect(saved.state.theme).toBe('light');
    expect(saved.state.notificationPrefs.promotions).toBe(true);
  });

  it('do not pretend to hold permission or two-factor state', () => {
    const state = useSettingsStore.getState() as unknown as Record<string, unknown>;
    expect(state.permissions).toBeUndefined();
    expect(state.twoFactorEnabled).toBeUndefined();
  });
});

describe('app-only job steps', () => {
  it('are remembered on the phone', async () => {
    useLocalStageStore.getState().setStage('job-1', 'PAY_VENDOR');
    const saved = await stored('fastermall-partner-local-stages');
    expect(saved.state.stages).toEqual({ 'job-1': 'PAY_VENDOR' });
  });

  it('are wiped with the rest of the account data', async () => {
    useLocalStageStore.getState().setStage('job-1', 'PAY_VENDOR');
    await resetAccountData();
    expect(useLocalStageStore.getState().stages).toEqual({});
    expect(await AsyncStorage.getItem('fastermall-partner-local-stages')).toBeNull();
  });
});
