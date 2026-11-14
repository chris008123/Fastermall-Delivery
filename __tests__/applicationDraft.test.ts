/* eslint-disable import/first -- jest.mock() must come before the imports it replaces */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// An in-memory keystore, so the test can see what reached encrypted storage.
const mockKeystore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (k: string) => mockKeystore.get(k) ?? null),
  setItemAsync: jest.fn(async (k: string, v: string) => {
    mockKeystore.set(k, v);
  }),
  deleteItemAsync: jest.fn(async (k: string) => {
    mockKeystore.delete(k);
  }),
}));
jest.mock('@/src/services/api', () => ({ apiFetch: jest.fn() }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EMPTY_APPLICATION,
  isBlankApplication,
  resumeStepIndex,
  type ApplicationForm,
} from '@/src/services/partnerApplication';
import {
  DRAFT_TTL_MS,
  isDraftExpired,
  useApplicationDraftStore,
} from '@/src/stores/applicationDraftStore';

const KEY = 'fastermall-partner-application-draft';
const now = new Date('2026-11-12T10:00:00Z');
const complete: ApplicationForm = {
  phone: '024 123 4567',
  email: 'kojo@example.com',
  fullName: 'Kojo Mensah',
  dateOfBirth: '14/05/2000',
  address: 'Ayeduase, Kumasi',
  vehicleMode: 'MOTORCYCLE',
  plateNumber: 'AS 1234-20',
};
const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(async () => {
  mockKeystore.clear();
  await AsyncStorage.clear();
  useApplicationDraftStore.getState().clearDraft();
  await flush();
});

describe('application draft helpers', () => {
  it('treats an untouched form as blank, and any typing as progress', () => {
    expect(isBlankApplication(EMPTY_APPLICATION)).toBe(true);
    expect(isBlankApplication({ ...EMPTY_APPLICATION, vehicleMode: 'WALKING' })).toBe(true);
    expect(isBlankApplication({ ...EMPTY_APPLICATION, email: 'k' })).toBe(false);
  });

  it('reopens on the step the person was on', () => {
    expect(resumeStepIndex(complete, 3, now)).toBe(3);
    expect(resumeStepIndex(complete, 2, now)).toBe(2);
    expect(resumeStepIndex(EMPTY_APPLICATION, 0, now)).toBe(0);
  });

  it('goes back to the first step that no longer passes', () => {
    expect(resumeStepIndex({ ...complete, email: 'not-an-email' }, 3, now)).toBe(0);
    expect(resumeStepIndex({ ...complete, dateOfBirth: '14/05/2015' }, 3, now)).toBe(1);
    expect(resumeStepIndex({ ...complete, plateNumber: '' }, 3, now)).toBe(2);
  });

  it('ignores a saved step that is out of range', () => {
    expect(resumeStepIndex(complete, 99, now)).toBe(3);
    expect(resumeStepIndex(complete, -2, now)).toBe(0);
    expect(resumeStepIndex(complete, Number.NaN, now)).toBe(0);
  });

  it('expires drafts after 30 days', () => {
    const t = now.getTime();
    expect(isDraftExpired(t - DRAFT_TTL_MS + 1000, t)).toBe(false);
    expect(isDraftExpired(t - DRAFT_TTL_MS - 1000, t)).toBe(true);
    expect(isDraftExpired(null, t)).toBe(true);
  });
});

describe('application draft store', () => {
  it('keeps the draft in encrypted storage, never in plain AsyncStorage', async () => {
    useApplicationDraftStore.getState().saveDraft(complete, 2);
    await flush();

    const saved = JSON.parse(mockKeystore.get(KEY) ?? 'null');
    expect(saved.state.form).toEqual(complete);
    expect(saved.state.stepIndex).toBe(2);
    expect(saved.state.hydrated).toBeUndefined();
    expect(await AsyncStorage.getItem(KEY)).toBeNull();
  });

  it('removes the personal details when cleared', async () => {
    useApplicationDraftStore.getState().saveDraft(complete, 2);
    await flush();
    useApplicationDraftStore.getState().clearDraft();
    await flush();

    const saved = JSON.parse(mockKeystore.get(KEY) ?? 'null');
    expect(saved?.state.form ?? null).toBeNull();
  });

  it('brings a recent draft back when the app starts again', async () => {
    mockKeystore.set(KEY, JSON.stringify({ state: { form: complete, stepIndex: 2, savedAt: Date.now() }, version: 1 }));
    await useApplicationDraftStore.persist.rehydrate();

    const s = useApplicationDraftStore.getState();
    expect(s.hydrated).toBe(true);
    expect(s.form).toEqual(complete);
    expect(s.stepIndex).toBe(2);
  });

  it('throws away a draft older than 30 days instead of restoring it', async () => {
    const old = Date.now() - DRAFT_TTL_MS - 60_000;
    mockKeystore.set(KEY, JSON.stringify({ state: { form: complete, stepIndex: 2, savedAt: old }, version: 1 }));
    await useApplicationDraftStore.persist.rehydrate();
    await flush();

    expect(useApplicationDraftStore.getState().form).toBeNull();
    expect(JSON.parse(mockKeystore.get(KEY) ?? 'null')?.state.form ?? null).toBeNull();
  });

  it('still opens the form when nothing was saved', async () => {
    await useApplicationDraftStore.persist.rehydrate();
    expect(useApplicationDraftStore.getState().hydrated).toBe(true);
    expect(useApplicationDraftStore.getState().form).toBeNull();
  });
});
