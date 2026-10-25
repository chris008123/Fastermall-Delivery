import { create } from 'zustand';
import { secureStateStorage } from '@/src/services/secureStorage';
import { createJSONStorage, persist } from 'zustand/middleware';

export type MomoNetwork = 'MTN' | 'Telecel' | 'AirtelTigo';

interface PayoutState {
  /** Where instant cash-outs are sent. Null until the partner adds one. */
  number: string | null;
  network: MomoNetwork;
  setDestination: (network: MomoNetwork, number: string) => void;
  clearDestination: () => void;
}

/** Local-only for now: the number is kept on this device and used for the
 * cash-out confirmation. Wire it to the backend payout endpoint when that
 * exists so it follows the partner across devices. */
export const usePayoutStore = create<PayoutState>()(
  persist(
    (set) => ({
      number: null,
      network: 'MTN',
      setDestination: (network, number) => set({ network, number }),
      clearDestination: () => set({ number: null }),
    }),
    {
      name: 'fastermall-partner-payout',
      storage: createJSONStorage(() => secureStateStorage),
      partialize: (s) => ({ number: s.number, network: s.network }),
    },
  ),
);

// The number rules live in utils/momo so they can be tested on their own;
// re-exported here so existing imports keep working.
export { isValidMomoNumber, maskMomoNumber } from '@/src/utils/momo';
