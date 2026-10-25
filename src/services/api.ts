import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { API_BASE_URL } from '@/src/config/env';
import { reportError } from '@/src/services/monitoring';
import { extractFieldErrors, type FieldErrors } from '@/src/utils/fieldErrors';

export { API_BASE_URL };

// The access token lives in the platform keychain/keystore (encrypted), not
// plain AsyncStorage. SecureStore keys can't contain "@", hence a new name;
// the old AsyncStorage key is only read to carry an existing session across.
const TOKEN_KEY = 'fastermall_delivery_access_token';
const LEGACY_TOKEN_KEY = '@fastermall_delivery_access_token';

/** Requests give up after this long. Generous because the backend can take a
 * while to wake up after sitting idle. */
const DEFAULT_TIMEOUT_MS = 30_000;

export async function getAccessToken() {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) return token;

  const legacy = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
  if (legacy) {
    await SecureStore.setItemAsync(TOKEN_KEY, legacy);
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
    return legacy;
  }

  return null;
}

export async function saveAccessToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
}

export async function clearAccessToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
}

let onSessionExpired: (() => void) | null = null;

/** The auth store registers here, so a 401 on any signed-in request ends the
 * session without api.ts having to import the store. */
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

/** An error response from the backend, with its HTTP status so callers can
 * tell "your session ended" (401/403) from "the server is struggling". */
export class ApiError extends Error {
  readonly status: number;
  /** Problems the server tied to a specific input, by field name. Often empty. */
  readonly fieldErrors: FieldErrors;

  constructor(message: string, status: number, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

type ApiOptions = RequestInit & {
  auth?: boolean;
  /** Overrides the default 30 second timeout. */
  timeoutMs?: number;
};

/**
 * Pulls a human-readable message out of a backend error body.
 * Handles: { message: string }, { message: string[] }, { error: string },
 * { error: { message: string | string[] } }, and plain-text bodies.
 */
function extractErrorMessage(data: unknown, status: number): string {
  const fallback = `Request failed with status ${status}`;

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (typeof data !== 'object' || data === null) {
    return fallback;
  }

  const body = data as { message?: unknown; error?: unknown };
  const raw = body.message ?? body.error;

  if (typeof raw === 'string') {
    return raw;
  }

  if (Array.isArray(raw)) {
    return raw.join(', ');
  }

  if (raw && typeof raw === 'object') {
    const inner = (raw as { message?: unknown }).message;
    if (typeof inner === 'string') return inner;
    if (Array.isArray(inner)) return inner.join(', ');
  }

  return fallback;
}

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { auth = true, headers, timeoutMs = DEFAULT_TIMEOUT_MS, ...requestOptions } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string> | undefined),
  };

  if (auth) {
    const token = await getAccessToken();

    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  // One AbortController covers both the timeout and a caller-supplied signal.
  const controller = new AbortController();
  const callerSignal = requestOptions.signal;
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  let response: Response;
  let text: string;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers: requestHeaders,
      signal: controller.signal,
    });
    text = await response.text();
  } catch (error) {
    // A caller that cancelled on purpose gets its own abort back.
    if (callerSignal?.aborted && !timedOut) throw error;

    // Status 0 = never got an answer. Callers treat it as "try again", never
    // as "your session ended".
    throw new ApiError(
      timedOut
        ? 'The server took too long to respond. Check your connection and try again.'
        : "Can't reach Fastermall. Check your connection and try again.",
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  // A rejected token on a signed-in request means the session is over.
  // (A wrong password on the sign-in request is also a 401, but that one
  // is sent with auth: false.)
  if (response.status === 401 && auth) {
    onSessionExpired?.();
  }

  if (!response.ok) {
    const apiError = new ApiError(extractErrorMessage(data, response.status), response.status, extractFieldErrors(data));

    // The server failing is worth hearing about. Wrong passwords, expired
    // sessions and other 4xx answers are normal, so they are not reported.
    if (response.status >= 500) {
      reportError(apiError, { status: response.status, path: path.split('?')[0].replace(/[0-9a-f-]{8,}/gi, ':id') });
    }

    throw apiError;
  }

  return data as T;
}
