export type JobType = 'MARKETPLACE' | 'FOOD' | 'LAUNDRY';

export type PartnerMode = 'WALKING' | 'MOTORCYCLE';

/**
 * The Pickup & Handover pipeline a job moves through once accepted.
 * FOOD jobs pass through PAY_VENDOR (the partner fronting their own
 * money) between heading to pickup and actually collecting the order —
 * every other type skips straight from EN_ROUTE_TO_PICKUP to PICKED_UP.
 */
export type JobStage =
  | 'AVAILABLE'
  | 'ACCEPTED'
  | 'EN_ROUTE_TO_PICKUP'
  | 'PAY_VENDOR'
  | 'PICKED_UP'
  | 'EN_ROUTE_TO_CUSTOMER'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'FAILED';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface JobLocation {
  label: string;
  sub: string;
  coordinate: Coordinate;
}

export interface Job {
  id: string;
  type: JobType;
  stage: JobStage;
  partnerMode: PartnerMode;
  /** Where the partner was idle when this job was accepted — the first leg
   * of the route shown on the live map, before pickup. */
  startCoordinate: Coordinate;
  pickup: JobLocation;
  dropoff: JobLocation;
  distanceKm: number;
  etaMinutes: number;
  deliveryFee: number;
  /** FOOD only — what the partner pays the vendor out of pocket, and gets
   * reimbursed for once the customer confirms delivery. */
  vendorPayoutAmount?: number;
  itemsSummary: string;
  customerName: string;
  /** Mock-only: the code the "customer" will read out at handover. In the
   * real app this comes from the backend; here any 4 digits are accepted
   * so the flow can be demoed end to end. */
  deliveryCode: string;
  createdAt: string;
  /** Set once the job reaches COMPLETED. */
  completedAt?: string;
  /** Set once the job reaches COMPLETED — a mock rating from the customer,
   * since there's no backend yet to actually collect one. */
  rating?: number;
}
