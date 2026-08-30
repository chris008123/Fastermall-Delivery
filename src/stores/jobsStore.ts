import { create } from 'zustand';
import { initialJobs } from '@/src/data/mockJobs';
import { useNotificationsStore } from '@/src/stores/notificationsStore';
import { useWalletStore } from '@/src/stores/walletStore';
import type { Job, JobStage, JobType } from '@/src/types/job';
import { formatCurrency } from '@/src/utils/money';
import { mockCustomerRating } from '@/src/utils/rating';

const PIPELINE: Record<JobType, JobStage[]> = {
  MARKETPLACE: ['ACCEPTED', 'EN_ROUTE_TO_PICKUP', 'PICKED_UP', 'EN_ROUTE_TO_CUSTOMER', 'DELIVERED', 'COMPLETED'],
  LAUNDRY: ['ACCEPTED', 'EN_ROUTE_TO_PICKUP', 'PICKED_UP', 'EN_ROUTE_TO_CUSTOMER', 'DELIVERED', 'COMPLETED'],
  // FOOD alone detours through PAY_VENDOR before the order can be
  // collected — the one step that isn't just physical movement.
  FOOD: ['ACCEPTED', 'EN_ROUTE_TO_PICKUP', 'PAY_VENDOR', 'PICKED_UP', 'EN_ROUTE_TO_CUSTOMER', 'DELIVERED', 'COMPLETED'],
};

export function pipelineFor(type: JobType) {
  return PIPELINE[type];
}

interface JobsState {
  jobs: Job[];
  acceptJob: (id: string) => void;
  advanceStage: (id: string) => void;
}

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: initialJobs,

  acceptJob: (id) =>
    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === id ? { ...j, stage: 'ACCEPTED' } : j)),
    })),

  advanceStage: (id) => {
    const job = get().jobs.find((j) => j.id === id);
    if (!job) return;

    const steps = PIPELINE[job.type];
    const currentIndex = steps.indexOf(job.stage);
    const next = steps[currentIndex + 1];
    if (!next) return;

    const completionFields =
      next === 'COMPLETED' ? { completedAt: new Date().toISOString(), rating: mockCustomerRating() } : {};

    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === id ? { ...j, stage: next, ...completionFields } : j)),
    }));

    if (next === 'COMPLETED') {
      const wallet = useWalletStore.getState();
      if (job.vendorPayoutAmount) {
        wallet.addEntry({
          type: 'REIMBURSEMENT',
          amount: job.vendorPayoutAmount,
          note: `Reimbursed for order at ${job.pickup.label}`,
          jobId: job.id,
        });
      }
      wallet.addEntry({
        type: 'EARNING',
        amount: job.deliveryFee,
        note: `Delivery earning — ${job.pickup.label} \u2192 ${job.dropoff.label}`,
        jobId: job.id,
      });

      useNotificationsStore.getState().addNotification({
        type: 'PAYMENT',
        title: 'Delivery completed',
        body: job.vendorPayoutAmount
          ? `${formatCurrency(job.vendorPayoutAmount)} reimbursed and ${formatCurrency(job.deliveryFee)} earned for the ${job.dropoff.label} delivery.`
          : `${formatCurrency(job.deliveryFee)} earned for the ${job.dropoff.label} delivery.`,
      });
    }
  },
}));

/** Average rating + count across every completed job with a rating —
 * shown on the partner's Profile. */
export function selectPartnerRating(jobs: Job[]) {
  const rated = jobs.filter((j) => j.stage === 'COMPLETED' && j.rating != null);
  if (rated.length === 0) return { average: 0, count: 0 };
  const total = rated.reduce((sum, j) => sum + (j.rating ?? 0), 0);
  return { average: total / rated.length, count: rated.length };
}
