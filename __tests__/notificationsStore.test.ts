/* eslint-disable import/first -- jest.mock() must come before the imports it replaces */
const mockApiFetch = jest.fn();
jest.mock('@/src/services/api', () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

import {
  toAppNotification,
  toAppType,
  UNDO_WINDOW_MS,
  useNotificationsStore,
} from '@/src/stores/notificationsStore';
import { pushRoute } from '@/src/services/push';

const row = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  title: 'New delivery available',
  body: 'A new delivery is waiting to be claimed.',
  type: 'DELIVERY_AVAILABLE',
  data: { jobId: `job-${id}`, deliveryId: `job-${id}` },
  isRead: false,
  createdAt: '2026-11-13T10:00:00.000Z',
  ...over,
});

async function load(rows: unknown[]) {
  mockApiFetch.mockResolvedValueOnce(rows);
  await useNotificationsStore.getState().loadNotifications();
}

beforeEach(() => {
  jest.useFakeTimers();
  mockApiFetch.mockReset();
  mockApiFetch.mockResolvedValue({});
  useNotificationsStore.setState({ notifications: [], isLoading: false, error: null });
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('alerts open what they are about (same as the push)', () => {
  it('a new job opens that job', () => {
    expect(toAppNotification(row('a')).href).toBe('/(partner)/jobs/job-a');
  });

  it('a support reply opens its chat, a cash-out opens the wallet, a document review opens Documents', () => {
    expect(toAppNotification(row('b', { type: 'SUPPORT_REPLY', data: { ticketId: 't1' } })).href).toBe(
      '/(partner)/support/chat?ticketId=t1',
    );
    expect(toAppNotification(row('c', { type: 'CASHOUT_PAID', data: { payoutId: 'p1' } })).href).toBe('/(partner)/wallet');
    expect(toAppNotification(row('d', { type: 'DOCUMENT_REVIEWED', data: { documentId: 'x' } })).href).toBe(
      '/(partner)/documents',
    );
  });

  it('a plain announcement has nowhere to go, while its push still opens the list', () => {
    expect(toAppNotification(row('e', { type: 'ANNOUNCEMENT', data: null })).href).toBeUndefined();
    expect(pushRoute({ type: 'ANNOUNCEMENT' })).toBe('/(partner)/notifications');
  });

  it('shows cash-outs with the wallet icon', () => {
    expect(toAppType('CASHOUT_FAILED')).toBe('PAYMENT');
    expect(toAppType('PAYOUT_RECORDED')).toBe('PAYMENT');
    expect(toAppType('DOCUMENT_REVIEWED')).toBe('SYSTEM');
  });
});

describe('read and unread are saved on the server', () => {
  it('marks everything read in one request', async () => {
    await load([row('a'), row('b'), row('c')]);
    useNotificationsStore.getState().markAllRead();

    expect(mockApiFetch).toHaveBeenCalledTimes(2); // the load + one read-all
    expect(mockApiFetch).toHaveBeenLastCalledWith('/notifications/read-all', { method: 'PATCH' });
    expect(useNotificationsStore.getState().notifications.every((n) => n.read)).toBe(true);
  });

  it('keeps "mark as unread" by telling the server', async () => {
    await load([row('a', { isRead: true })]);
    useNotificationsStore.getState().setRead('a', false);

    expect(mockApiFetch).toHaveBeenLastCalledWith('/notifications/a', { method: 'PATCH', body: JSON.stringify({ isRead: false }) });
    expect(useNotificationsStore.getState().notifications[0].read).toBe(false);
  });
});

describe('dismissing', () => {
  it('deletes on the server once the Undo window has passed, and stays gone after reloading', async () => {
    await load([row('a'), row('b')]);
    useNotificationsStore.getState().dismiss(['a']);
    expect(useNotificationsStore.getState().notifications.map((n) => n.id)).toEqual(['b']);
    expect(mockApiFetch).not.toHaveBeenCalledWith('/notifications/a', { method: 'DELETE' });

    // A reload during the Undo window doesn't bring it back.
    await load([row('a'), row('b')]);
    expect(useNotificationsStore.getState().notifications.map((n) => n.id)).toEqual(['b']);

    jest.advanceTimersByTime(UNDO_WINDOW_MS);
    expect(mockApiFetch).toHaveBeenCalledWith('/notifications/a', { method: 'DELETE' });
  });

  it('Undo puts alerts back in place and nothing is deleted', async () => {
    await load([row('a'), row('b'), row('c')]);
    useNotificationsStore.getState().dismiss(['a', 'c']);
    useNotificationsStore.getState().undoDismiss(['a', 'c']);

    expect(useNotificationsStore.getState().notifications.map((n) => n.id)).toEqual(['a', 'b', 'c']);
    jest.advanceTimersByTime(UNDO_WINDOW_MS * 2);
    expect(mockApiFetch).not.toHaveBeenCalledWith(expect.anything(), { method: 'DELETE' });
  });
});
