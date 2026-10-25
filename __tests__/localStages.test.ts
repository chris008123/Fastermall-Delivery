import { applyLocalStage, pruneLocalStages } from '@/src/utils/localStages';
import type { JobStage } from '@/src/types/job';

describe('applyLocalStage', () => {
  it('shows the pay-vendor step while the backend is still on the trip to pickup', () => {
    expect(applyLocalStage('EN_ROUTE_TO_PICKUP', 'PAY_VENDOR')).toBe('PAY_VENDOR');
  });

  it('shows the code-entry step while the backend is still on the trip to the customer', () => {
    expect(applyLocalStage('EN_ROUTE_TO_CUSTOMER', 'DELIVERED')).toBe('DELIVERED');
  });

  it('trusts the backend once it has moved past the app-only step', () => {
    expect(applyLocalStage('PICKED_UP', 'PAY_VENDOR')).toBe('PICKED_UP');
    expect(applyLocalStage('COMPLETED', 'DELIVERED')).toBe('COMPLETED');
  });

  it('never applies a step to the wrong point in the trip', () => {
    expect(applyLocalStage('EN_ROUTE_TO_CUSTOMER', 'PAY_VENDOR')).toBe('EN_ROUTE_TO_CUSTOMER');
    expect(applyLocalStage('EN_ROUTE_TO_PICKUP', 'DELIVERED')).toBe('EN_ROUTE_TO_PICKUP');
  });

  it('uses the backend stage when nothing is remembered', () => {
    expect(applyLocalStage('ACCEPTED', undefined)).toBe('ACCEPTED');
  });
});

describe('pruneLocalStages', () => {
  const backend = new Map<string, JobStage>([
    ['a', 'EN_ROUTE_TO_PICKUP'],
    ['b', 'PICKED_UP'],
    ['c', 'EN_ROUTE_TO_CUSTOMER'],
  ]);

  it('keeps steps that are still true', () => {
    expect(pruneLocalStages({ a: 'PAY_VENDOR', c: 'DELIVERED' }, backend)).toEqual({ a: 'PAY_VENDOR', c: 'DELIVERED' });
  });

  it('drops steps the backend has moved past', () => {
    expect(pruneLocalStages({ b: 'PAY_VENDOR' }, backend)).toEqual({});
  });

  it('drops steps for jobs that are no longer listed', () => {
    expect(pruneLocalStages({ gone: 'PAY_VENDOR' }, backend)).toEqual({});
  });
});
