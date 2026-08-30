/** Mock customer rating for a just-completed delivery — skewed positive
 * (most real delivery ratings cluster at 4–5), since there's no backend
 * yet to collect a real one. */
export function mockCustomerRating(): number {
  const roll = Math.random();
  if (roll < 0.55) return 5;
  if (roll < 0.85) return 4;
  return 3;
}
