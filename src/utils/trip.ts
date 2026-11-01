import type { Job } from '@/src/types/job';

/** "1.2 km · ~8 min", skipping whatever the backend didn't provide.
 * Distance/ETA are often 0 because GPS isn't part of the MVP, and
 * "0.0 km · ~0 min" reads like real data. */
export function tripSummary(job: Pick<Job, 'distanceKm' | 'etaMinutes'>, extra: string[] = []): string {
  const parts: string[] = [];
  if (job.distanceKm > 0) parts.push(`${job.distanceKm.toFixed(1)} km`);
  if (job.etaMinutes > 0) parts.push(`~${job.etaMinutes} min`);
  return [...parts, ...extra].join(' · ');
}
