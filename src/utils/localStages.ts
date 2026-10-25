import type { JobStage } from '@/src/types/job';

/** The two job steps that exist only in the app: the backend has no status
 * for paying the vendor, or for typing in the customer's code. */
export type LocalStage = 'PAY_VENDOR' | 'DELIVERED';

/**
 * The stage to show for a job: the app-only step if the partner is in it and
 * the backend is still on the step just before it, otherwise the backend's.
 */
export function applyLocalStage(backendStage: JobStage, local: LocalStage | undefined): JobStage {
  if (local === 'PAY_VENDOR' && backendStage === 'EN_ROUTE_TO_PICKUP') return 'PAY_VENDOR';
  if (local === 'DELIVERED' && backendStage === 'EN_ROUTE_TO_CUSTOMER') return 'DELIVERED';
  return backendStage;
}

/** Keeps only the remembered steps that are still true: the job is still
 * listed and the backend hasn't moved past the step before them. */
export function pruneLocalStages(
  stages: Record<string, LocalStage>,
  backendStages: ReadonlyMap<string, JobStage>,
): Record<string, LocalStage> {
  const kept: Record<string, LocalStage> = {};
  for (const [id, local] of Object.entries(stages)) {
    const backend = backendStages.get(id);
    if (backend && applyLocalStage(backend, local) === local) kept[id] = local;
  }
  return kept;
}
