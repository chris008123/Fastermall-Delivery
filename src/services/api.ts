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
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
        ? data.message
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}
