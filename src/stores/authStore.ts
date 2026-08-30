import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  phone: string | null;
  signIn: (phone: string) => void;
  signOut: () => void;
}

// Mock-only session — no real backend to check credentials against yet, so
// any non-empty phone/password combination succeeds (same philosophy as
// the delivery handover code: the flow is real, the verification is a
// stand-in until there's a backend to call).
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  phone: null,
  signIn: (phone) => set({ isAuthenticated: true, phone }),
  signOut: () => set({ isAuthenticated: false, phone: null }),
}));
