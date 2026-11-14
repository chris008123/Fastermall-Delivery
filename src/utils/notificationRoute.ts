// Where a notification leads. Shared by push taps (services/push.ts) and the
// in-app Alerts list, so both open the same screen for the same alert.

// Ids come from the notification payload, so only plain ids are allowed into
// a route. Anything else (slashes, dots, query strings) is ignored.
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * The screen for a notification's type and data, or null when it has
 * nowhere specific to go (announcements, document reviews…).
 */
export function notificationRoute(data: Record<string, unknown> | null | undefined): string | null {
  const type = typeof data?.type === 'string' ? data.type.toUpperCase() : '';
  const id = [data?.jobId, data?.deliveryId].find((v): v is string => typeof v === 'string' && SAFE_ID.test(v));
  if (/^(CASHOUT|PAYOUT)/.test(type)) return '/(partner)/wallet';
  const ticketId = typeof data?.ticketId === 'string' && SAFE_ID.test(data.ticketId) ? data.ticketId : undefined;
  if (type === 'SUPPORT_REPLY') return ticketId ? `/(partner)/support/chat?ticketId=${ticketId}` : '/(partner)/support/chat';
  if (type === 'DOCUMENT_REVIEWED') return '/(partner)/documents';
  if (id && type === 'DELIVERY_AVAILABLE') return `/(partner)/jobs/${id}`;
  if (id && type !== 'DELIVERY_CANCELLED') return `/(partner)/active/${id}`;
  return null;
}
