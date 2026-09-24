import { create } from 'zustand';
import { apiFetch } from '@/src/services/api';
import type { PartnerMode } from '@/src/types/job';

interface PartnerState {
  name: string;
  mode: PartnerMode;
  vehiclePlate: string | null;
  isAvailable: boolean;
  profileId: string | null;
  setAvailable: (available: boolean) => Promise<void>;
  setMode: (mode: PartnerMode) => void;
  setVehiclePlate: (plate: string) => void;
  loadProfile: () => Promise<void>;
}

interface StaffProfile {
  id: string;
  fullName: string;
  role: string;
  deliveryProfile?: {
    id: string;
    type: PartnerMode;
    isAvailable: boolean;
    vehiclePlate: string | null;
  } | null;
}

export const usePartnerStore = create<PartnerState>((set) => ({
  name: '',
  mode: 'WALKING',
  vehiclePlate: null,
  isAvailable: false,
  profileId: null,

  loadProfile: async () => {
    const profile = await apiFetch<StaffProfile>('/staff/me');

    const deliveryProfile = profile.deliveryProfile;

    if (!deliveryProfile) {
      throw new Error(
        'This staff account does not have a delivery partner profile.',
      );
    }

    set({
      name: profile.fullName,
      mode: deliveryProfile.type,
      isAvailable: deliveryProfile.isAvailable,
      vehiclePlate: deliveryProfile.vehiclePlate,
      profileId: deliveryProfile.id,
    });
  },

  setAvailable: async (available) => {
    const previous = usePartnerStore.getState().isAvailable;

    console.log('TOGGLE PRESSED:', available);

    set({
      isAvailable: available,
    });

    console.log(
      'LOCAL STATE AFTER SET:',
      usePartnerStore.getState().isAvailable,
    );

    try {
      const response = await apiFetch('/logistics/me', {
        method: 'PATCH',
        body: JSON.stringify({
          isAvailable: available,
        }),
      });

      console.log(
        'BACKEND AVAILABILITY RESPONSE:',
        JSON.stringify(response, null, 2),
      );
    } catch (error) {
      console.log('AVAILABILITY ERROR:', error);

      set({
        isAvailable: previous,
      });

      throw error;
    }
  },

  setMode: (mode) =>
    set({
      mode,
    }),

  setVehiclePlate: (vehiclePlate) =>
    set({
      vehiclePlate,
    }),
}));
