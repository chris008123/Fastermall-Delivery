import * as Linking from 'expo-linking';
import type { NavigationApp } from '@/src/stores/settingsStore';
import type { JobLocation } from '@/src/types/job';

/** The backend doesn't send coordinates yet, so jobs carry a 0,0
 * placeholder — treat that as "no coordinate" instead of routing the
 * partner to the middle of the ocean. */
function hasRealCoordinate({ latitude, longitude }: JobLocation['coordinate']) {
  return !(latitude === 0 && longitude === 0);
}

/** Opens turn-by-turn directions to `destination` in the partner's
 * preferred nav app, using its coordinate when known and otherwise
 * searching for its address label. */
export function openNavigation(app: NavigationApp, destination: JobLocation) {
  const { coordinate, label } = destination;
  const useCoordinate = hasRealCoordinate(coordinate);
  const latLng = `${coordinate.latitude},${coordinate.longitude}`;
  const query = encodeURIComponent(label);

  if (app === 'GOOGLE_MAPS') {
    const target = useCoordinate ? latLng : query;
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${target}&travelmode=driving`).catch(() => {});
    return;
  }

  if (app === 'WAZE') {
    const url = useCoordinate
      ? `https://waze.com/ul?ll=${latLng}&navigate=yes`
      : `https://waze.com/ul?q=${query}&navigate=yes`;
    Linking.openURL(url).catch(() => {});
  }
}
