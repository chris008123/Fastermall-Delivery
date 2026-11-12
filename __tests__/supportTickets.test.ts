/* eslint-disable import/first -- jest.mock() must come before the imports it replaces */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
const mockApiFetch = jest.fn();
jest.mock('@/src/services/api', () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

import {
  getConversation,
  isOpen,
  listConversations,
  sendMessage,
  startConversation,
  subjectFor,
  toConversation,
} from '@/src/services/supportTickets';

const ticket = {
  id: 't1',
  subject: 'Partner: Customer not answering at Unity Hall',
  message: 'Customer not answering at Unity Hall',
  status: 'IN_PROGRESS' as const,
  createdAt: '2026-11-12T10:00:00Z',
  replies: [
    { id: 'r1', fromAdmin: true, message: 'Calling them now', createdAt: '2026-11-12T10:02:00Z' },
    { id: 'r2', fromAdmin: false, message: 'Thanks', createdAt: '2026-11-12T10:03:00Z' },
  ],
};

beforeEach(() => mockApiFetch.mockReset());

describe('support conversations', () => {
  it('shows the first message, then the replies in order', () => {
    expect(toConversation(ticket).messages.map((m) => [m.fromSupport, m.text])).toEqual([
      [false, 'Customer not answering at Unity Hall'],
      [true, 'Calling them now'],
      [false, 'Thanks'],
    ]);
  });

  it('starts a ticket with a short subject from the message', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: { ...ticket, replies: undefined, status: 'OPEN' } });
    const conv = await startConversation('  Customer not answering at Unity Hall  ', 'd-1');
    expect(mockApiFetch.mock.calls[0][0]).toBe('/support/tickets');
    expect(JSON.parse(mockApiFetch.mock.calls[0][1].body)).toEqual({
      subject: 'Partner: Customer not answering at Unity Hall',
      message: 'Customer not answering at Unity Hall',
      deliveryId: 'd-1',
    });
    expect(conv.messages).toHaveLength(1);
  });

  it('keeps long subjects within the limit', () => {
    const s = subjectFor('x'.repeat(500));
    expect(s.length).toBeLessThanOrEqual(120);
    expect(s.startsWith('Partner: ')).toBe(true);
  });

  it('lists, opens and replies', async () => {
    mockApiFetch.mockResolvedValueOnce([ticket]).mockResolvedValueOnce(ticket).mockResolvedValueOnce({});
    expect((await listConversations()).map((t) => t.id)).toEqual(['t1']);
    expect((await getConversation('t1')).messages).toHaveLength(3);
    await sendMessage('t1', ' On my way back ');
    expect(mockApiFetch).toHaveBeenLastCalledWith('/support/tickets/t1/messages', {
      method: 'POST',
      body: JSON.stringify({ body: 'On my way back' }),
    });
  });

  it('treats only closed tickets as finished', () => {
    expect(isOpen('RESOLVED')).toBe(true);
    expect(isOpen('CLOSED')).toBe(false);
  });
});
