import type { LedgerEntry } from '@/src/types/wallet';

// Tied to the already-COMPLETED jobs seeded in mockJobs.ts (job-6/7/8) so
// the Wallet ledger, the Jobs history tab, and the earnings chart all
// agree with each other from the very first load.
export const initialLedger: LedgerEntry[] = [
  { id: 'ldg-1', type: 'WITHDRAWAL', amount: -50, note: 'Cashed out to mobile money', createdAt: daysAgo(1) },
  { id: 'ldg-2', type: 'EARNING', amount: 10, note: 'Delivery earning — Company Laundry, Bomso \u2192 Independence Hall, Annex 3', jobId: 'job-8', createdAt: daysAgo(1) },
  { id: 'ldg-3', type: 'EARNING', amount: 9, note: 'Delivery earning — KNUST Warehouse \u2192 Katanga Hall, Block C', jobId: 'job-7', createdAt: daysAgo(1) },
  { id: 'ldg-4', type: 'REIMBURSEMENT', amount: 24, note: 'Reimbursed for order at Central Cafeteria', jobId: 'job-6', createdAt: daysAgo(2) },
  { id: 'ldg-5', type: 'EARNING', amount: 7, note: 'Delivery earning — Central Cafeteria \u2192 Unity Hall, Room A02', jobId: 'job-6', createdAt: daysAgo(2) },
];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
