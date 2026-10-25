import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import {
  ApiError,
  apiFetch,
  clearAccessToken,
  getAccessToken,
  saveAccessToken,
  setSessionExpiredHandler,
} from '@/src/services/api';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => void store.set(k, v)),
    deleteItemAsync: jest.fn(async (k: string) => void store.delete(k)),
    __store: store,
  };
});

const secureStore = (SecureStore as unknown as { __store: Map<string, string> }).__store;
const mockFetch = jest.fn();
const jsonResponse = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) }) as Response;

beforeEach(async () => {
  jest.clearAllMocks();
  jest.useRealTimers();
  secureStore.clear();
  await AsyncStorage.clear();
  globalThis.fetch = mockFetch as unknown as typeof fetch;
  setSessionExpiredHandler(null);
});

describe('access token storage', () => {
  it('keeps the token in secure storage, not AsyncStorage', async () => {
    await saveAccessToken('abc');
    expect(await getAccessToken()).toBe('abc');
    expect(secureStore.size).toBe(1);
    expect(await AsyncStorage.getAllKeys()).toEqual([]);
  });

  it('moves a token saved by an older app version into secure storage', async () => {
    await AsyncStorage.setItem('@fastermall_delivery_access_token', 'old-token');
    expect(await getAccessToken()).toBe('old-token');
    expect(secureStore.size).toBe(1);
    expect(await AsyncStorage.getItem('@fastermall_delivery_access_token')).toBeNull();
  });

  it('removes the token everywhere on clear', async () => {
    await saveAccessToken('abc');
    await AsyncStorage.setItem('@fastermall_delivery_access_token', 'old');
    await clearAccessToken();
    expect(await getAccessToken()).toBeNull();
  });
});

describe('apiFetch', () => {
  it('sends the bearer token and returns the parsed body', async () => {
    await saveAccessToken('abc');
    mockFetch.mockResolvedValue(jsonResponse(200, { ok: 1 }));
    await expect(apiFetch('/x')).resolves.toEqual({ ok: 1 });
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer abc');
  });

  it('ends the session on a 401 from a signed-in request', async () => {
    const handler = jest.fn();
    setSessionExpiredHandler(handler);
    mockFetch.mockResolvedValue(jsonResponse(401, { message: 'Unauthorized' }));
    await expect(apiFetch('/x')).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not end the session when the sign-in request itself gets a 401', async () => {
    const handler = jest.fn();
    setSessionExpiredHandler(handler);
    mockFetch.mockResolvedValue(jsonResponse(401, { message: 'Invalid credentials' }));
    await expect(apiFetch('/login', { auth: false })).rejects.toMatchObject({ message: 'Invalid credentials' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not end the session on a 403 or a server error', async () => {
    const handler = jest.fn();
    setSessionExpiredHandler(handler);
    mockFetch.mockResolvedValueOnce(jsonResponse(403, { message: 'Forbidden' }));
    mockFetch.mockResolvedValueOnce(jsonResponse(500, { message: 'Oops' }));
    await expect(apiFetch('/x')).rejects.toBeInstanceOf(ApiError);
    await expect(apiFetch('/x')).rejects.toBeInstanceOf(ApiError);
    expect(handler).not.toHaveBeenCalled();
  });

  it('turns a failed connection into a friendly ApiError with status 0', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));
    await expect(apiFetch('/x')).rejects.toMatchObject({ status: 0, message: expect.stringContaining("Can't reach") });
  });

  it('gives up on a request that never answers', async () => {
    jest.useFakeTimers();
    mockFetch.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal!.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const result = apiFetch('/x', { timeoutMs: 5000 });
    const assertion = expect(result).rejects.toMatchObject({ status: 0, message: expect.stringContaining('too long') });
    await jest.advanceTimersByTimeAsync(5000);
    await assertion;
  });

  it('hands a caller\'s own cancellation back untouched', async () => {
    const controller = new AbortController();
    mockFetch.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal!.addEventListener('abort', () => reject(new Error('cancelled by caller')));
        }),
    );
    const result = apiFetch('/x', { signal: controller.signal });
    // Wait until the request is actually in flight before cancelling it.
    while (mockFetch.mock.calls.length === 0) await new Promise((r) => setTimeout(r, 0));
    controller.abort();
    await expect(result).rejects.toThrow('cancelled by caller');
  });
});
