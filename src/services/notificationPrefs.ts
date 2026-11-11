import { apiFetch } from '@/src/services/api';
import type { NotificationPrefs } from '@/src/stores/settingsStore';

// The partner's notification switches live on the server, which decides
// which pushes to send:  GET / PUT /logistics/me/preferences
//   { notifications: { newJobs, jobUpdates, payments, promotions, sound } }
// Vibration is up to the phone's notification channel, so it stays local.

const PATH = '/logistics/me/preferences';

type ServerNotifications = {
  newJobs?: boolean;
  jobUpdates?: boolean;
  payments?: boolean;
  promotions?: boolean;
  sound?: boolean;
};

/** The body for PUT: only the switches the server knows. */
export function toServerPrefs(prefs: NotificationPrefs): { notifications: ServerNotifications } {
  return {
    notifications: {
      newJobs: prefs.newJobRequests,
      jobUpdates: prefs.jobUpdates,
      payments: prefs.payments,
      promotions: prefs.promotions,
      sound: prefs.sound,
    },
  };
}

/** The server's switches as local ones; unknown or missing values are left out. */
export function fromServerPrefs(raw: unknown): Partial<NotificationPrefs> {
  const body = raw && typeof raw === 'object' && 'data' in raw ? (raw as { data: unknown }).data : raw;
  const n = (body as { notifications?: ServerNotifications } | null)?.notifications ?? {};
  const out: Partial<NotificationPrefs> = {};
  const take = (from: keyof ServerNotifications, to: keyof NotificationPrefs) => {
    if (typeof n[from] === 'boolean') out[to] = n[from];
  };
  take('newJobs', 'newJobRequests');
  take('jobUpdates', 'jobUpdates');
  take('payments', 'payments');
  take('promotions', 'promotions');
  take('sound', 'sound');
  return out;
}

export async function fetchNotificationPrefs(): Promise<Partial<NotificationPrefs>> {
  return fromServerPrefs(await apiFetch<unknown>(PATH));
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  await apiFetch(PATH, { method: 'PUT', body: JSON.stringify(toServerPrefs(prefs)) });
}
