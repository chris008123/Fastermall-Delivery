import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type MomoNetwork = 'MTN' | 'Telecel' | 'AirtelTigo';

interface PayoutState {
  /** Where instant cash-outs are sent. Null until the partner adds one. */
  number: string | null;
  network: MomoNetwork;
  setDestination: (network: MomoNetwork, number: string) => void;
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
    }),
    {
      name: 'fastermall-partner-payout',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ number: s.number, network: s.network }),
    },
  ),
);

export const isValidMomoNumber = (value: string) => /^0\d{9}$/.test(value);

/** "0241234567" -> "024 ··· 4567" */
export const maskMomoNumber = (value: string) => `${value.slice(0, 3)} ··· ${value.slice(-4)}`;
