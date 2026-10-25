import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { getPartnerPosition } from '@/src/utils/geo';
import { colors, radii } from '@/src/theme';
import type { Coordinate, Job } from '@/src/types/job';

interface DeliveryMapProps {
  job: Job;
  /** Hides the partner's live-position marker and the start→pickup leg —
   * used on the Job Detail screen, before the job (and its start point)
   * exist yet. */
  showPartner?: boolean;
  height?: number;
}

function computeRegion(points: Coordinate[]) {
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;
  const latitudeDelta = Math.max((maxLat - minLat) * 1.8, 0.01);
  const longitudeDelta = Math.max((maxLng - minLng) * 1.8, 0.01);

  return { latitude, longitude, latitudeDelta, longitudeDelta };
}

/**
 * The literal physical route behind the Pickup & Handover flow. Reads
 * straight from `job` — same data the RouteStepper renders — so the map
 * and the stepper can never disagree about where the partner is.
 */
export function DeliveryMap({ job, showPartner = true, height = 200 }: DeliveryMapProps) {
  const accent = colors.jobType[job.type].dark;
  const points = showPartner
    ? [job.startCoordinate, job.pickup.coordinate, job.dropoff.coordinate]
    : [job.pickup.coordinate, job.dropoff.coordinate];
  const region = computeRegion(points);
  const partnerPosition = showPartner ? getPartnerPosition(job) : null;

  return (
    <View style={{ height, borderRadius: radii.card, overflow: 'hidden' }}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {showPartner && (
          <Polyline
            coordinates={[job.startCoordinate, job.pickup.coordinate]}
            strokeColor={colors.neutral[400]}
            strokeWidth={3}
            lineDashPattern={[6, 6]}
          />
        )}
        <Polyline
          coordinates={[job.pickup.coordinate, job.dropoff.coordinate]}
          strokeColor={accent}
          strokeWidth={4}
        />

        <Marker coordinate={job.pickup.coordinate} title="Pickup" description={job.pickup.label} pinColor={accent} />
        <Marker coordinate={job.dropoff.coordinate} title="Drop-off" description={job.dropoff.label} pinColor={colors.neutral[600]} />

        {partnerPosition && (
          <Marker coordinate={partnerPosition} title="You" anchor={{ x: 0.5, y: 0.5 }}>
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: accent,
                borderWidth: 3,
                borderColor: '#fff',
              }}
            />
          </Marker>
        )}
      </MapView>
    </View>
  );
}
