/* eslint-disable import/first -- jest.mock() must come before the imports it replaces */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { fromServerPrefs, toServerPrefs } from '@/src/services/notificationPrefs';
import { pushRoute } from '@/src/services/push';

describe('pushRoute', () => {
  it('opens a new job to accept it', () => {
    expect(pushRoute({ type: 'DELIVERY_AVAILABLE', jobId: 'job-1' })).toBe('/(partner)/jobs/job-1');
  });

  it('opens an accepted delivery on its active screen', () => {
    expect(pushRoute({ type: 'DELIVERY_STATUS', deliveryId: 'd-9' })).toBe('/(partner)/active/d-9');
  });

  it('sends a cancelled delivery and anything unknown to the inbox', () => {
    expect(pushRoute({ type: 'DELIVERY_CANCELLED', jobId: 'job-1' })).toBe('/(partner)/notifications');
    expect(pushRoute({ type: 'DOCUMENT_REVIEWED' })).toBe('/(partner)/notifications');
    expect(pushRoute(undefined)).toBe('/(partner)/notifications');
  });

  it('opens the wallet for cash-outs and payouts', () => {
    expect(pushRoute({ type: 'CASHOUT_PAID' })).toBe('/(partner)/wallet');
    expect(pushRoute({ type: 'PAYOUT_RECORDED' })).toBe('/(partner)/wallet');
  });

  it('opens the support conversation support replied to', () => {
    expect(pushRoute({ type: 'SUPPORT_REPLY', ticketId: 't-1' })).toBe('/(partner)/support/chat?ticketId=t-1');
    expect(pushRoute({ type: 'SUPPORT_REPLY', ticketId: '../x' })).toBe('/(partner)/support/chat');
  });

  it('ignores unsafe ids', () => {
    expect(pushRoute({ type: 'DELIVERY_AVAILABLE', jobId: '../settings' })).toBe('/(partner)/notifications');
  });
});

describe('notification switches on the server', () => {
  const local = {
    newJobRequests: true,
    jobUpdates: false,
    payments: true,
    promotions: false,
    sound: false,
    vibration: true,
  };

  it('sends the server names, without vibration', () => {
    expect(toServerPrefs(local)).toEqual({
      notifications: { newJobs: true, jobUpdates: false, payments: true, promotions: false, sound: false },
    });
  });

  it('reads them back, wrapped or not, skipping bad values', () => {
    expect(fromServerPrefs({ success: true, data: { notifications: { newJobs: false, sound: 'yes' }, active: {} } })).toEqual({
      newJobRequests: false,
    });
    expect(fromServerPrefs({ notifications: { payments: false } })).toEqual({ payments: false });
    expect(fromServerPrefs(null)).toEqual({});
  });
});
