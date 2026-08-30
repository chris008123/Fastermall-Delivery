import { create } from 'zustand';
import type { PartnerMode } from '@/src/types/job';

interface PartnerState {
  name: string;
  mode: PartnerMode;
  vehiclePlate: string | null;
  isAvailable: boolean;
  setAvailable: (available: boolean) => void;
  setMode: (mode: PartnerMode) => void;
}

export const usePartnerStore = create<PartnerState>((set) => ({
  name: 'Kojo Mensah',
  mode: 'MOTORCYCLE',
  vehiclePlate: 'AS 4471-24',
  isAvailable: false,
  setAvailable: (isAvailable) => set({ isAvailable }),
  setMode: (mode) => set({ mode, vehiclePlate: mode === 'MOTORCYCLE' ? 'AS 4471-24' : null }),
}));
