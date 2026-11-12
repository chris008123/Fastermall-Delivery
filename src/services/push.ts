import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiFetch } from '@/src/services/api';

// Push notifications for delivery partners: Android channels, foreground
// banners, the phone's permission, the Expo push token, and keeping the
// backend's device list in step. The backend decides what to send (see the
// notification switches in Settings > Notifications).
//
// Backend contract (Fastermall-Backend APP_CHANGES, 2.4):
//   - Partner pushes use the Android channel "deliveries" (customers' use
//     "orders"). Android only pops a banner for HIGH/MAX channels, and a
//     channel's importance can't be raised once created.
//   - POST /notifications/devices { token, platform } after every sign-in;
//     DELETE /notifications/devices?token=… on sign-out.
//   - Pushes carry data.type (e.g. DELIVERY_AVAILABLE, DELIVERY_CANCELLED,
//     CASHOUT_PAID) and data.jobId / data.deliveryId for delivery ones.

// expo-notifications is a native module. Until the app is rebuilt with it,
// requiring it throws, so it's loaded defensively.
type NotificationsModule = typeof import('expo-notifications');
let N: NotificationsModule | null = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    N = require('expo-notifications') as NotificationsModule;
  } catch {
    N = null;
  }
}

export const isPushAvailable = () => N !== null;

const DEVICES_PATH = '/notifications/devices';
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

let configured = false;
let currentToken: string | null = null;

/**
 * Creates the channels and shows banners while the app is open. Safe to call
 * more than once. `playSound` follows the partner's Sound switch.
 */
export async function configurePush(playSound: () => boolean): Promise<void> {
  if (!N || configured) return;
  configured = true;
  N.setNotificationHandler({
    handleNotification: async () => {
      const sound = playSound();
      return { shouldShowBanner: true, shouldShowList: true, shouldPlaySound: sound, shouldSetBadge: false };
    },
  });
  if (Platform.OS === 'android') {
    const channel = {
      importance: N.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E07A2E',
    };
    await N.setNotificationChannelAsync('deliveries', { name: 'Deliveries', ...channel });
    await N.setNotificationChannelAsync('orders', { name: 'Orders', ...channel });
  }
}

export type PushPermission = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export async function getPushPermission(): Promise<PushPermission> {
  if (!N) return 'unavailable';
  try {
    const p = await N.getPermissionsAsync();
    return p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'unavailable';
  }
}

export async function requestPushPermission(): Promise<PushPermission> {
  if (!N) return 'unavailable';
  try {
    const p = await N.requestPermissionsAsync();
    return p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'unavailable';
  }
}

function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/**
 * Asks for permission if needed, gets this phone's Expo push token and
 * registers it with the signed-in account. Returns false when pushes can't be
 * set up (no permission, emulator, old build); the in-app list still works.
 */
export async function registerForPush(): Promise<boolean> {
  if (!N) return false;
  try {
    let permission = await getPushPermission();
    if (permission === 'undetermined') permission = await requestPushPermission();
    if (permission !== 'granted') return false;
    const { data: token } = await N.getExpoPushTokenAsync({ projectId: projectId() });
    if (!token) return false;
    await apiFetch(DEVICES_PATH, { method: 'POST', body: JSON.stringify({ token, platform: Platform.OS }) });
    currentToken = token;
    return true;
  } catch {
    // Retried on the next launch or sign-in.
    return false;
  }
}

/**
 * Removes this phone from the account. Call before the session is cleared:
 * the request needs the token.
 */
export async function unregisterFromPush(): Promise<void> {
  const token = currentToken;
  currentToken = null;
  if (!token) return;
  try {
    await apiFetch(`${DEVICES_PATH}?token=${encodeURIComponent(token)}`, { method: 'DELETE' });
  } catch {
    // The server also drops tokens Expo reports as no longer registered.
  }
}

/** Where tapping a push should go. Exported for tests. */
export function pushRoute(data: Record<string, unknown> | undefined): string {
  const type = typeof data?.type === 'string' ? data.type.toUpperCase() : '';
  const id = [data?.jobId, data?.deliveryId].find((v): v is string => typeof v === 'string' && SAFE_ID.test(v));
  if (/^(CASHOUT|PAYOUT)/.test(type)) return '/(partner)/wallet';
  const ticketId = typeof data?.ticketId === 'string' && SAFE_ID.test(data.ticketId) ? data.ticketId : undefined;
  if (type === 'SUPPORT_REPLY') return ticketId ? `/(partner)/support/chat?ticketId=${ticketId}` : '/(partner)/support/chat';
  if (id && type === 'DELIVERY_AVAILABLE') return `/(partner)/jobs/${id}`;
  if (id && type !== 'DELIVERY_CANCELLED') return `/(partner)/active/${id}`;
  return '/(partner)/notifications';
}

/** Calls back with a route when a notification is tapped. Returns an unsubscribe. */
export function addPushTapListener(onRoute: (route: string) => void): () => void {
  if (!N) return () => {};
  const sub = N.addNotificationResponseReceivedListener((response) => {
    onRoute(pushRoute(response.notification.request.content.data));
  });
  return () => sub.remove();
}

/** Calls back whenever a push arrives while the app is open (to refresh lists). */
export function addPushReceivedListener(onReceive: () => void): () => void {
  if (!N) return () => {};
  const sub = N.addNotificationReceivedListener(() => onReceive());
  return () => sub.remove();
}

let launchHandled = false;

/** The route for the push that opened the app from closed, once per launch. */
export async function getLaunchPushRoute(): Promise<string | null> {
  if (!N || launchHandled) return null;
  launchHandled = true;
  try {
    const response = await N.getLastNotificationResponseAsync();
    return response ? pushRoute(response.notification.request.content.data) : null;
  } catch {
    return null;
  }
}
