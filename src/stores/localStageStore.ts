import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { LocalStage } from '@/src/utils/localStages';

interface LocalStageState {
  /** Jobs the partner has taken into an app-only step, by job id. Kept on the
   * phone so closing the app mid-delivery doesn't send them a step back. */
  stages: Record<string, LocalStage>;
  setStage: (jobId: string, stage: LocalStage) => void;
  replaceAll: (stages: Record<string, LocalStage>) => void;
}

export const useLocalStageStore = create<LocalStageState>()(
  persist(
    (set) => ({
      stages: {},
      setStage: (jobId, stage) => set((s) => ({ stages: { ...s.stages, [jobId]: stage } })),
      replaceAll: (stages) => set({ stages }),
    }),
    {
      name: 'fastermall-partner-local-stages',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ stages: s.stages }),
    },
  ),
);
