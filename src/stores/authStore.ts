import { create } from 'zustand';
import {
  ApiError,
  apiFetch,
  clearAccessToken,
  getAccessToken,
  saveAccessToken,
} from '@/src/services/api';
import { clearAccountSession, prepareAccountSession } from '@/src/stores/sessionReset';

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

    await saveAccessToken(response.data.accessToken);

    const meResponse = await apiFetch<MeResponse>('/staff/me');

    const user = meResponse.data;

    if (user.role !== 'DELIVERY_PARTNER') {
      await clearAccessToken();
      throw new Error('This account is not a delivery partner.');
    }

    // Never let this account see data left on the device by a different one.
    await prepareAccountSession(user.id);

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
    } catch (error) {
      // Only a response from the server saying the session is over (401/403)
      // ends it. No signal, a timeout or a server hiccup must not sign a
      // delivery partner out: the token stays and the screens show their own
      // retry states until the connection is back.
      const sessionEnded =
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403);

      if (sessionEnded) {
        await clearAccessToken();
        await clearAccountSession();

        set({
          isAuthenticated: false,
          user: null,
          isHydrating: false,
        });
        return;
      }

      set({
        isAuthenticated: true,
        user: null,
        isHydrating: false,
      });
    }
  },

  signOut: async () => {
    await clearAccessToken();

    // Flip to signed-out first so the partner screens leave before their
    // data is emptied, then wipe everything tied to the account.
    set({
      isAuthenticated: false,
      user: null,
      isHydrating: false,
    });

    await clearAccountSession();
  },
}));
