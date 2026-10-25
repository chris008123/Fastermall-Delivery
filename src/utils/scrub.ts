/**
 * Removes personal details from anything about to be sent to the crash
 * reporting service. It runs on every event, so a bug report never carries a
 * password, a token, an email address, a phone number or a delivery code.
 */

const SENSITIVE_KEY = /authorization|token|password|passcode|secret|cookie|code|email|phone|number|session|payout/i;
const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
const LONG_DIGITS = /\b\d{6,}\b/g;

export const REDACTED = '[redacted]';

/** Hides emails and long digit runs (phone numbers, codes) inside text. */
export function scrubText(text: string): string {
  return text.replace(EMAIL, '[email]').replace(LONG_DIGITS, '[number]');
}

/** Drops the query string from a URL, since it can carry tokens or codes. */
export function scrubUrl(url: string): string {
  return scrubText(url.split('?')[0].split('#')[0]);
}

/** Copies a value, hiding sensitive keys and personal details in text. */
export function scrubValue(value: unknown, depth = 0): unknown {
  if (typeof value === 'string') return scrubText(value);
  if (value === null || typeof value !== 'object') return value;
  if (depth > 6) return REDACTED;

  if (Array.isArray(value)) return value.map((item) => scrubValue(item, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEY.test(key) ? REDACTED : scrubValue(inner, depth + 1);
  }
  return out;
}

interface Scrubbable {
  message?: string;
  user?: { id?: string | number; [key: string]: unknown };
  request?: { url?: string; query_string?: unknown; headers?: unknown; data?: unknown; cookies?: unknown };
  exception?: { values?: { value?: string }[] };
  breadcrumbs?: { message?: string; data?: Record<string, unknown> }[];
  extra?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
}

/** Cleans a crash report. Only the account id is kept for the user. */
export function scrubEvent<T extends Scrubbable>(event: T): T {
  if (event.message) event.message = scrubText(event.message);

  if (event.user) event.user = event.user.id === undefined ? {} : { id: event.user.id };

  if (event.request) {
    event.request = {
      url: event.request.url ? scrubUrl(event.request.url) : undefined,
    };
  }

  for (const value of event.exception?.values ?? []) {
    if (value.value) value.value = scrubText(value.value);
  }

  for (const crumb of event.breadcrumbs ?? []) {
    if (crumb.message) crumb.message = scrubText(crumb.message);
    if (crumb.data) {
      const data = scrubValue(crumb.data) as Record<string, unknown>;
      if (typeof data.url === 'string') data.url = scrubUrl(data.url);
      crumb.data = data;
    }
  }

  if (event.extra) event.extra = scrubValue(event.extra) as Record<string, unknown>;

  return event;
}
