import type { Coordinate, JobType } from '@/src/types/job';

export type DemandLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface DemandZone {
  id: string;
  name: string;
  coordinate: Coordinate;
  level: DemandLevel;
  nearbyOrders: number;
}

export interface DemandSnapshot {
  /** Which kind of order the counts and the earnings estimate describe. */
  jobType: JobType;
  headline: string;
  totalNearbyOrders: number;
  radiusKm: number;
  estimatedHourlyMin: number;
  estimatedHourlyMax: number;
  zones: DemandZone[];
}
