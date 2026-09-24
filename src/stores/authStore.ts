import { create } from 'zustand';
import {
  apiFetch,
  clearAccessToken,
  getAccessToken,
  saveAccessToken,
} from '@/src/services/api';

export interface StaffUser {
  id: string;
  email: string | null;
  fullName: string;
  role: string;
}

interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
  };
}

interface MeResponse {
  success: boolean;
  data: StaffUser;
}

interface AuthState {
  isAuthenticated: boolean;
  isHydrating: boolean;
  user: StaffUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  hydrate: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isHydrating: true,
  user: null,

  signIn: async (email, password) => {
    const response = await apiFetch<LoginResponse>('/staff/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    console.log('LOGIN RESPONSE:', JSON.stringify(response, null, 2));

    await saveAccessToken(response.data.accessToken);

    const meResponse = await apiFetch<MeResponse>('/staff/me');

    const user = meResponse.data;

    if (user.role !== 'DELIVERY_PARTNER') {
      await clearAccessToken();
      throw new Error('This account is not a delivery partner.');
    }

    set({
      isAuthenticated: true,
      user,
      isHydrating: false,
    });
  },

  hydrate: async () => {
    try {
      const token = await getAccessToken();

      if (!token) {
        set({
          isAuthenticated: false,
          user: null,
          isHydrating: false,
        });
        return;
      }

      const response = await apiFetch<MeResponse>('/staff/me');

      const user = response.data;

      if (user.role !== 'DELIVERY_PARTNER') {
        await clearAccessToken();

        set({
          isAuthenticated: false,
          user: null,
          isHydrating: false,
        });

        return;
      }

      set({
        isAuthenticated: true,
        user,
        isHydrating: false,
      });
    } catch {
      await clearAccessToken();

      set({
        isAuthenticated: false,
        user: null,
        isHydrating: false,
      });
    }
  },

  signOut: async () => {
    await clearAccessToken();

    set({
      isAuthenticated: false,
      user: null,
      isHydrating: false,
    });
  },
}));
