import type { Job } from '@/src/types/job';

/** The only job type this partner app currently offers. Change it here and
 * Home, Jobs and the new-job alerts all follow. */
export const OFFERED_JOB_TYPE: Job['type'] = 'FOOD';

export const OFFERED_JOB_LABEL = 'Food jobs';

/** "food", "marketplace" or "laundry", for use in a sentence ("8 food orders"). */
export const jobTypeNoun = (type: Job['type']) => type.toLowerCase();

/** An open job this partner can actually accept right now. */
export const isOfferedOpenJob = (job: Job) => job.stage === 'AVAILABLE' && job.type === OFFERED_JOB_TYPE;
