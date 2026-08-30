import { pipelineFor } from '@/src/stores/jobsStore';
import type { Coordinate, Job } from '@/src/types/job';

function lerp(a: Coordinate, b: Coordinate, t: number): Coordinate {
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * t,
    longitude: a.longitude + (b.longitude - a.longitude) * t,
  };
}

/**
 * Where the partner's marker sits on the live map for the job's current
 * stage. There's no real GPS feed behind this (frontend-only, mock data),
 * so position is derived from the same `job.stage` that drives the
 * RouteStepper — the map and the stepper always agree because they read
 * the same source of truth, they just aren't animated in real time.
 */
export function getPartnerPosition(job: Job): Coordinate {
  const pipeline = pipelineFor(job.type);
  const index = pipeline.indexOf(job.stage);
  const total = pipeline.indexOf('PICKED_UP'); // last index of the "heading to pickup" leg

  if (job.stage === 'AVAILABLE' || index <= 0) return job.startCoordinate;

  if (index < total) {
    // Still on the start → pickup leg.
    const t = index / total;
    return lerp(job.startCoordinate, job.pickup.coordinate, t);
  }

  if (index === total) return job.pickup.coordinate;

  // On the pickup → drop-off leg.
  const legLength = pipeline.length - 1 - total;
  const t = (index - total) / legLength;
  return lerp(job.pickup.coordinate, job.dropoff.coordinate, Math.min(t, 1));
}
