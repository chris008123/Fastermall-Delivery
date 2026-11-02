import type { Job } from '@/src/types/job';

/** The only job type this partner app currently offers. Change it here and
 * Home, Jobs and the new-job alerts all follow. */
export const OFFERED_JOB_TYPE: Job['type'] = 'FOOD';

export const OFFERED_JOB_LABEL = 'Food jobs';

/** "food", "marketplace" or "laundry", for use in a sentence ("8 food orders"). */
export const jobTypeNoun = (type: Job['type']) => type.toLowerCase();

/** An open job this partner can actually accept right now. */
export const isOfferedOpenJob = (job: Job) => job.stage === 'AVAILABLE' && job.type === OFFERED_JOB_TYPE;

/** Ids of open jobs the partner hasn't been told about yet — the basis for
 * the "N new jobs available" alert on the Jobs tab. */
export function findFreshJobIds(jobs: readonly Job[], seen: ReadonlySet<string>): string[] {
  return jobs.filter((j) => isOfferedOpenJob(j) && !seen.has(j.id)).map((j) => j.id);
}

/** How many food orders a partner may carry at the same time. The backend
 * must enforce this too (see BACKEND_CHANGES_NEEDED.md) — the app check
 * only stops the partner from trying. */
export const MAX_ACTIVE_FOOD_JOBS = 3;

/** Claimed by this partner and not yet finished or failed. */
export const isActiveJob = (job: Job) =>
  job.stage !== 'AVAILABLE' && job.stage !== 'COMPLETED' && job.stage !== 'FAILED';

/** The partner's food orders in progress, oldest-claimed order preserved. */
export const activeFoodJobs = (jobs: readonly Job[]) =>
  jobs.filter((j) => j.type === 'FOOD' && isActiveJob(j));

/** True when the partner is already carrying the maximum number of food orders. */
export const isAtFoodJobLimit = (jobs: readonly Job[]) =>
  activeFoodJobs(jobs).length >= MAX_ACTIVE_FOOD_JOBS;
