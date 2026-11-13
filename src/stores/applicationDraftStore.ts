import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { secureStateStorage } from '@/src/services/secureStorage';
import type { ApplicationForm } from '@/src/services/partnerApplication';

// A "Become a partner" application that hasn't been sent yet, so closing the
// app (or Android killing it in the background) doesn't lose what was typed.
// It holds personal details (date of birth, address, phone), so it lives in
// the encrypted keystore/keychain, and is deleted once the application is
// sent, when the person taps "Start over", or after DRAFT_TTL_MS.

export const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function isDraftExpired(savedAt: number | null, now: number): boolean {
  return savedAt === null || now - savedAt > DRAFT_TTL_MS;
}

interface ApplicationDraftState {
  form: ApplicationForm | null;
  stepIndex: number;
  savedAt: number | null;
  hydrated: boolean;
  saveDraft: (form: ApplicationForm, stepIndex: number) => void;
  clearDraft: () => void;
}

export const useApplicationDraftStore = create<ApplicationDraftState>()(
  persist(
    (set) => ({
      form: null,
      stepIndex: 0,
      savedAt: null,
      hydrated: false,

      saveDraft: (form, stepIndex) => set({ form, stepIndex, savedAt: Date.now() }),

      clearDraft: () => set({ form: null, stepIndex: 0, savedAt: null }),
    }),
    {
      name: 'fastermall-partner-application-draft',
      version: 1,
      storage: createJSONStorage(() => secureStateStorage),
      partialize: (s) => ({ form: s.form, stepIndex: s.stepIndex, savedAt: s.savedAt }),
      // Also runs when nothing was saved or reading failed: either way the form
      // must open (empty), so `hydrated` always ends up true.
      onRehydrateStorage: () => (state) => {
        if (state?.form && isDraftExpired(state.savedAt, Date.now())) state.clearDraft();
        useApplicationDraftStore.setState({ hydrated: true });
      },
    },
  ),
);

/** True when there is an unsent application to come back to. */
export function useHasApplicationDraft() {
  return useApplicationDraftStore((s) => s.form !== null);
}
