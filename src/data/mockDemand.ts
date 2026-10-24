import type { DemandSnapshot } from '@/src/types/demand';

export const demandSnapshot: DemandSnapshot = {
  jobType: 'FOOD',
  headline: 'High demand near you',
  totalNearbyOrders: 8,
  radiusKm: 2,
  estimatedHourlyMin: 45,
  estimatedHourlyMax: 65,
  zones: [
    { id: 'zone-central', name: 'KNUST Central', coordinate: { latitude: 6.6759, longitude: -1.5711 }, level: 'HIGH', nearbyOrders: 4 },
    { id: 'zone-ayeduase', name: 'Ayeduase', coordinate: { latitude: 6.6688, longitude: -1.5675 }, level: 'HIGH', nearbyOrders: 2 },
    { id: 'zone-bomso', name: 'Bomso', coordinate: { latitude: 6.6723, longitude: -1.5744 }, level: 'MEDIUM', nearbyOrders: 1 },
    { id: 'zone-commercial', name: 'Commercial Area', coordinate: { latitude: 6.6795, longitude: -1.5739 }, level: 'LOW', nearbyOrders: 1 },
  ],
};
