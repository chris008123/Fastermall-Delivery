import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL =
  'https://fastermall-super-app-backend.onrender.com/api/v1';

const TOKEN_KEY = '@fastermall_delivery_access_token';

export async function getAccessToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function saveAccessToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearAccessToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

type ApiOptions = RequestInit & {
  auth?: boolean;
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
  const { auth = true, headers, ...requestOptions } = options;

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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: requestHeaders,
  });

  const text = await response.text();

  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, response.status));
  }

  return data as T;
}
