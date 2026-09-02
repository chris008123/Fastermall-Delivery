import type { Job } from '@/src/types/job';

const BASE_FARE = 2.5;
const DISTANCE_RATE_PER_KM = 1.0;
const TIME_RATE_PER_MIN = 0.15;

export interface FareBreakdown {
  baseFare: number;
  distanceAmount: number;
  timeAmount: number;
  bonus: number;
  total: number;
}

/** Splits a job's delivery fee into the components a partner actually
 * cares about seeing — same rate card driving every job's fee, so the
 * numbers stay consistent no matter which job you tap into. Any
 * remainder (promos, surge, rounding) shows as a bonus line rather than
 * disappearing into an unexplained total. */
export function computeFareBreakdown(job: Job): FareBreakdown {
  const baseFare = BASE_FARE;
  const distanceAmount = round2(job.distanceKm * DISTANCE_RATE_PER_KM);
  const timeAmount = round2(job.etaMinutes * TIME_RATE_PER_MIN);
  let bonus = round2(job.deliveryFee - baseFare - distanceAmount - timeAmount);

  // Safety clamp: if the rate card ever overshoots the actual fee (e.g. a
  // very short, very cheap job), fold the shortfall back into the base
  // fare rather than showing a confusing negative bonus.
  let adjustedBase = baseFare;
  if (bonus < 0) {
    adjustedBase = round2(baseFare + bonus);
    bonus = 0;
  }

  return { baseFare: adjustedBase, distanceAmount, timeAmount, bonus, total: job.deliveryFee };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
