import * as Linking from 'expo-linking';
import type { NavigationApp } from '@/src/stores/settingsStore';
import type { Coordinate } from '@/src/types/job';

/** Opens turn-by-turn directions to `destination` in the partner's
 * preferred nav app. FASTERMALL_MAPS is a deliberate no-op — the built-in
 * map is already on screen, so there's nothing to hand off to. */
export function openNavigation(app: NavigationApp, destination: Coordinate) {
  const { latitude, longitude } = destination;

  if (app === 'GOOGLE_MAPS') {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`).catch(() => {});
    return;
  }

  if (app === 'WAZE') {
    Linking.openURL(`https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`).catch(() => {});
    return;
  }
}
