import { apiFetch } from '@/src/services/api';

// Messages with Fastermall support, as support tickets (backend support module):
//   POST /support/tickets            { subject, message, deliveryId? }
//   GET  /support/tickets            own tickets, newest first
//   GET  /support/tickets/:id        one ticket with `replies` (oldest first)
//   POST /support/tickets/:id/messages { body }   409 TICKET_CLOSED once closed
// Admins answer from the console; the partner gets a SUPPORT_REPLY push.

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface ChatMessage {
  id: string;
  /** True for Fastermall support, false for the partner. */
  fromSupport: boolean;
  text: string;
  at: string;
}

export interface Conversation {
  id: string;
  subject: string;
  status: TicketStatus;
  messages: ChatMessage[];
}

type ReplyJson = { id: string; fromAdmin?: boolean; message?: string; body?: string; createdAt: string };
type TicketJson = {
  id: string;
  subject: string;
  message: string;
  status: TicketStatus;
  createdAt: string;
  replies?: ReplyJson[];
};

const unwrap = <T,>(raw: unknown): T =>
  (raw && typeof raw === 'object' && 'data' in raw && 'success' in raw ? (raw as { data: T }).data : raw) as T;

/** The ticket as a conversation: the partner's first message, then the replies. Exported for tests. */
export function toConversation(t: TicketJson): Conversation {
  return {
    id: t.id,
    subject: t.subject,
    status: t.status,
    messages: [
      { id: `${t.id}-first`, fromSupport: false, text: t.message, at: t.createdAt },
      ...(t.replies ?? []).map((r) => ({
        id: r.id,
        fromSupport: r.fromAdmin !== false,
        text: r.message ?? r.body ?? '',
        at: r.createdAt,
      })),
    ],
  };
}

/** Closed conversations can't be answered; a new message starts a new one. */
export const isOpen = (status: TicketStatus) => status !== 'CLOSED';

/** A short subject for the console's list, from the first message. Exported for tests. */
export function subjectFor(text: string): string {
  const firstLine = text.trim().split('\n')[0].replace(/\s+/g, ' ');
  const short = firstLine.length > 80 ? `${firstLine.slice(0, 77)}…` : firstLine;
  return `Partner: ${short}`.slice(0, 120);
}

export async function listConversations(): Promise<{ id: string; status: TicketStatus; subject: string; createdAt: string }[]> {
  const body = unwrap<TicketJson[] | { data: TicketJson[] }>(await apiFetch<unknown>('/support/tickets'));
  const list = Array.isArray(body) ? body : (body?.data ?? []);
  return list.map((t) => ({ id: t.id, status: t.status, subject: t.subject, createdAt: t.createdAt }));
}

export async function getConversation(id: string): Promise<Conversation> {
  return toConversation(unwrap<TicketJson>(await apiFetch<unknown>(`/support/tickets/${encodeURIComponent(id)}`)));
}

/** Starts a conversation with the first message (5–2000 characters). */
export async function startConversation(text: string, deliveryId?: string): Promise<Conversation> {
  const created = unwrap<TicketJson>(
    await apiFetch<unknown>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify({ subject: subjectFor(text), message: text.trim(), ...(deliveryId ? { deliveryId } : {}) }),
    }),
  );
  return toConversation({ ...created, replies: created.replies ?? [] });
}

export async function sendMessage(id: string, text: string): Promise<void> {
  await apiFetch(`/support/tickets/${encodeURIComponent(id)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body: text.trim() }),
  });
}
