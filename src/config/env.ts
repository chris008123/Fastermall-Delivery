/** The production API. Used when no EXPO_PUBLIC_API_URL is set. */
export const DEFAULT_API_URL = 'https://fastermall-super-app-backend.onrender.com/api/v1';

/**
 * Turns the configured API address into the one the app will call.
 *
 * - No value: the default (production) address.
 * - Trailing slashes are dropped, so paths join cleanly.
 * - Anything that is not https is refused outside development, so a typo
 *   can never send a partner's password over plain http.
 *
 * It throws on a bad value instead of quietly using production, because a
 * staging build that silently talks to production is worse than one that
 * refuses to start.
 */
export function resolveApiBaseUrl(
  value: string | undefined,
  fallback: string = DEFAULT_API_URL,
  allowInsecure = false,
): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`EXPO_PUBLIC_API_URL is not a valid address: "${trimmed}"`);
  }

  if (url.protocol !== 'https:' && !(allowInsecure && url.protocol === 'http:')) {
    throw new Error('EXPO_PUBLIC_API_URL must start with https://');
  }

  return trimmed.replace(/\/+$/, '');
}

// EXPO_PUBLIC_ variables are filled in at build time (see eas.json per
// build profile, or a local .env file). They end up inside the app, so never
// put a secret in one.
export const API_BASE_URL = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL, DEFAULT_API_URL, __DEV__);
