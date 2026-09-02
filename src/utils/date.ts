/** "12 Mar 2027" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Whole days between now and the given ISO date (negative if already past). */
export function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/** The next upcoming Friday (payout day), formatted as "Fri, 5 Sep". If
 * today is Friday, returns next week's Friday rather than today. */
export function nextPayoutDate(): string {
  const d = new Date();
  const daysToAdd = ((5 - d.getDay() + 7) % 7) || 7;
  d.setDate(d.getDate() + daysToAdd);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
