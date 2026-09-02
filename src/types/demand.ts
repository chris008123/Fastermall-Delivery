import type { Coordinate } from '@/src/types/job';

export type DemandLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface DemandZone {
  id: string;
  name: string;
  coordinate: Coordinate;
  level: DemandLevel;
  nearbyOrders: number;
}

export interface DemandSnapshot {
  headline: string;
  totalNearbyOrders: number;
  radiusKm: number;
  estimatedHourlyMin: number;
  estimatedHourlyMax: number;
  zones: DemandZone[];
}
