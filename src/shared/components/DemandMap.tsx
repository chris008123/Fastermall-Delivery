import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { radii } from '@/src/ds/tokens';
import { useTheme } from '@/src/ds/useTheme';
import type { DemandZone } from '@/src/types/demand';

const LEVEL_RADIUS_M: Record<DemandZone['level'], number> = {
  HIGH: 380,
  MEDIUM: 260,
  LOW: 180,
};

interface DemandMapProps {
  zones: DemandZone[];
  height?: number;
  scrollEnabled?: boolean;
}

export function DemandMap({ zones, height = 200, scrollEnabled = false }: DemandMapProps) {
  const { t } = useTheme();
  const LEVEL_COLOR: Record<DemandZone['level'], string> = {
    HIGH: t.alert,
    MEDIUM: t.warn,
    LOW: t.info,
  };
  const lats = zones.map((z) => z.coordinate.latitude);
  const lngs = zones.map((z) => z.coordinate.longitude);
  const region = {
    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
    longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    latitudeDelta: Math.max((Math.max(...lats) - Math.min(...lats)) * 2.2, 0.018),
    longitudeDelta: Math.max((Math.max(...lngs) - Math.min(...lngs)) * 2.2, 0.018),
  };

  return (
    <View style={{ height, borderRadius: radii.md, overflow: 'hidden' }}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        scrollEnabled={scrollEnabled}
        zoomEnabled={scrollEnabled}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {zones.map((zone) => (
          <Circle
            key={zone.id}
            center={zone.coordinate}
            radius={LEVEL_RADIUS_M[zone.level]}
            fillColor={`${LEVEL_COLOR[zone.level]}33`}
            strokeColor={LEVEL_COLOR[zone.level]}
            strokeWidth={1.5}
          />
        ))}
        {zones.map((zone) => (
          <Marker key={`${zone.id}-pin`} coordinate={zone.coordinate} title={zone.name} />
        ))}
      </MapView>
    </View>
  );
}
