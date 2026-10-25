import * as Sentry from '@sentry/react-native';
import { APP_ENV, SENTRY_DSN } from '@/src/config/env';
import { scrubEvent, scrubUrl, scrubValue } from '@/src/utils/scrub';

/**
 * Crash and error reporting (Sentry). Everything goes through this file, so
 * the rest of the app never imports Sentry directly and nothing is sent
 * unless a DSN is configured.
 *
 * Reports are for fixing bugs, not for tracking people: no personal data is
 * attached, the only user detail is the account id, and every report is
 * scrubbed first (see utils/scrub.ts).
 */

export function initMonitoring(): void {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Off in development and whenever no DSN is set (including tests).
    enabled: Boolean(SENTRY_DSN) && !__DEV__,
    environment: APP_ENV,
    sendDefaultPii: false,
    attachScreenshot: false,
    tracesSampleRate: 0,
    beforeSend: (event) => scrubEvent(event),
    beforeBreadcrumb: (crumb) => {
      if (crumb.message) crumb.message = scrubValue(crumb.message) as string;
      if (crumb.data) {
        const data = scrubValue(crumb.data) as Record<string, unknown>;
        if (typeof data.url === 'string') data.url = scrubUrl(data.url);
        crumb.data = data;
      }
      return crumb;
    },
  });
}

/** Records an error you caught and handled but still want to hear about. */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  Sentry.captureException(error, context ? { extra: scrubValue(context) as Record<string, unknown> } : undefined);
}

/** Ties reports to an account id (nothing else), or clears it on sign-out. */
export function setMonitoringUser(id: string | null): void {
  Sentry.setUser(id ? { id } : null);
}

export const wrapWithMonitoring = Sentry.wrap;
