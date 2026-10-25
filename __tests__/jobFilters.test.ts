import type { Job } from '@/src/types/job';
import { findFreshJobIds, isOfferedOpenJob, OFFERED_JOB_TYPE } from '@/src/utils/jobFilters';

// Only the fields the filters read matter here.
const job = (id: string, stage: Job['stage'], type: Job['type'] = OFFERED_JOB_TYPE) =>
  ({ id, stage, type }) as Job;

describe('isOfferedOpenJob', () => {
  it('is true for an available job of the offered type', () => {
    expect(isOfferedOpenJob(job('a', 'AVAILABLE'))).toBe(true);
  });

  it('is false once the job has been taken', () => {
    expect(isOfferedOpenJob(job('a', 'ACCEPTED'))).toBe(false);
    expect(isOfferedOpenJob(job('a', 'COMPLETED'))).toBe(false);
  });

  it('is false for a job type this partner is not offered', () => {
    const other: Job['type'] = OFFERED_JOB_TYPE === 'FOOD' ? 'LAUNDRY' : 'FOOD';
    expect(isOfferedOpenJob(job('a', 'AVAILABLE', other))).toBe(false);
  });
});

describe('findFreshJobIds', () => {
  it('returns open jobs that have not been seen', () => {
    const jobs = [job('a', 'AVAILABLE'), job('b', 'AVAILABLE')];
    expect(findFreshJobIds(jobs, new Set(['a']))).toEqual(['b']);
  });

  it('returns nothing when every open job was already seen', () => {
    const jobs = [job('a', 'AVAILABLE')];
    expect(findFreshJobIds(jobs, new Set(['a']))).toEqual([]);
  });

  it('ignores new jobs that are not open or not offered', () => {
    const other: Job['type'] = OFFERED_JOB_TYPE === 'FOOD' ? 'LAUNDRY' : 'FOOD';
    const jobs = [job('a', 'ACCEPTED'), job('b', 'AVAILABLE', other), job('c', 'AVAILABLE')];
    expect(findFreshJobIds(jobs, new Set())).toEqual(['c']);
  });

  it('flags everything on the first look when nothing has been seen', () => {
    const jobs = [job('a', 'AVAILABLE'), job('b', 'AVAILABLE')];
    expect(findFreshJobIds(jobs, new Set())).toEqual(['a', 'b']);
  });

  it('does not re-flag a job that disappears and comes back after being seen', () => {
    const seen = new Set<string>();
    const first = findFreshJobIds([job('a', 'AVAILABLE')], seen);
    first.forEach((id) => seen.add(id));
    expect(findFreshJobIds([], seen)).toEqual([]);
    expect(findFreshJobIds([job('a', 'AVAILABLE')], seen)).toEqual([]);
  });
});
