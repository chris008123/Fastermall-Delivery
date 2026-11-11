import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  addPushReceivedListener,
  addPushTapListener,
  configurePush,
  getLaunchPushRoute,
  registerForPush,
} from '@/src/services/push';
import { useNotificationsStore } from '@/src/stores/notificationsStore';
import { useSettingsStore } from '@/src/stores/settingsStore';

/**
 * Sets up push for the signed-in partner: channels and foreground banners,
 * registers this phone, opens the right screen when a push is tapped, and
 * refreshes the in-app list when one arrives. Renders nothing.
 */
export function PushSetup() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    void (async () => {
      await configurePush(() => useSettingsStore.getState().notificationPrefs.sound);
      await registerForPush();
      // Opened from a push while the app was closed.
      const launch = await getLaunchPushRoute();
      if (alive && launch) router.push(launch as never);
    })();
    const offTap = addPushTapListener((route) => router.push(route as never));
    const offReceive = addPushReceivedListener(() => {
      void useNotificationsStore.getState().loadNotifications();
    });
    return () => {
      alive = false;
      offTap();
      offReceive();
    };
  }, [router]);

  return null;
}
