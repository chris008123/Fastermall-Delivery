import { create } from 'zustand';
import { initialLedger } from '@/src/data/mockLedger';
import type { LedgerEntry } from '@/src/types/wallet';

interface WalletState {
  ledger: LedgerEntry[];
  withdrawalThreshold: number;
  addEntry: (entry: Omit<LedgerEntry, 'id' | 'createdAt'>) => void;
  withdraw: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  ledger: initialLedger,
  // Matches the GH₵50 threshold from the Food flow diagram — earnings
  // only become cashable once they cross this line. Reimbursements are
  // never gated by it: that money was always the partner's own.
  withdrawalThreshold: 50,

  addEntry: (entry) =>
    set((state) => ({
      ledger: [
        { ...entry, id: `ldg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() },
        ...state.ledger,
      ],
    })),

  withdraw: () => {
    const balance = selectEarningsBalance(get().ledger);
    if (balance < get().withdrawalThreshold) return;
    get().addEntry({ type: 'WITHDRAWAL', amount: -balance, note: 'Cashed out to mobile money' });
  },
}));

/** Earnings credited minus whatever's already been withdrawn — the figure
 * that's compared against the GH₵50 threshold. */
export function selectEarningsBalance(ledger: LedgerEntry[]) {
  return ledger.reduce((sum, e) => {
    if (e.type === 'EARNING') return sum + e.amount;
    if (e.type === 'WITHDRAWAL') return sum + e.amount; // stored negative
    return sum;
  }, 0);
}

/** Lifetime reimbursements — shown separately since this lane is always
 * available and never subject to the cash-out threshold. */
export function selectReimbursedTotal(ledger: LedgerEntry[]) {
  return ledger.filter((e) => e.type === 'REIMBURSEMENT').reduce((sum, e) => sum + e.amount, 0);
}
