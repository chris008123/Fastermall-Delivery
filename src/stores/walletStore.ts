import { create } from 'zustand';
import { apiFetch } from '@/src/services/api';
import type { LedgerEntry } from '@/src/types/wallet';

interface BackendEarning {
  id: string;
  partnerId: string;
  amount: string | number;
  note: string | null;
  createdAt: string;
}

interface EarningsResponse {
  success: boolean;
  data: {
    total: number;
    earnings: BackendEarning[];
  };
}

interface WalletState {
  ledger: LedgerEntry[];
  withdrawalThreshold: number;
  isLoading: boolean;
  error: string | null;

  loadWallet: () => Promise<void>;

  addEntry: (entry: Omit<LedgerEntry, 'id' | 'createdAt'>) => void;
  withdraw: () => void;
  withdrawInstant: (feeAmount: number) => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  ledger: [],
  withdrawalThreshold: 50,
  isLoading: false,
  error: null,

  loadWallet: async () => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await apiFetch<EarningsResponse>(
        '/logistics/me/earnings',
      );

      const ledger: LedgerEntry[] = response.data.earnings.map((earning) => ({
        id: earning.id,
        type: 'EARNING',
        amount: Number(earning.amount),
        note: earning.note ?? 'Delivery earning',
        createdAt: earning.createdAt,
      }));

      set({
        ledger,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load wallet data.',
      });

      throw error;
    }
  },

  addEntry: (entry) =>
    set((state) => ({
      ledger: [
        {
          ...entry,
          id: `ldg-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        },
        ...state.ledger,
      ],
    })),

  withdraw: () => {
    const balance = selectEarningsBalance(get().ledger);

    if (balance < get().withdrawalThreshold) return;

    get().addEntry({
      type: 'WITHDRAWAL',
      amount: -balance,
      note: 'Cashed out to mobile money',
    });
  },

  withdrawInstant: (feeAmount) => {
    const balance = selectEarningsBalance(get().ledger);

    if (balance < get().withdrawalThreshold) return;

    get().addEntry({
      type: 'WITHDRAWAL',
      amount: -balance,
      note: `Instant cash out (GH₵ ${feeAmount.toFixed(
        2,
      )} fee) to mobile money`,
    });
  },
}));

export function selectEarningsBalance(ledger: LedgerEntry[]) {
  return ledger.reduce((sum, entry) => {
    if (entry.type === 'EARNING') {
      return sum + entry.amount;
    }

    if (entry.type === 'WITHDRAWAL') {
      return sum + entry.amount;
    }

    return sum;
  }, 0);
}

export function selectReimbursedTotal(ledger: LedgerEntry[]) {
  return ledger
    .filter((entry) => entry.type === 'REIMBURSEMENT')
    .reduce((sum, entry) => sum + entry.amount, 0);
}
