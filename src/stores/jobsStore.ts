import { create } from 'zustand';
import { apiFetch } from '@/src/services/api';
import type {
  FailureReason,
  Job,
  JobStage,
  JobType,
  PartnerMode,
} from '@/src/types/job';

type BackendDeliveryStatus =
  | 'ASSIGNED'
  | 'EN_ROUTE_TO_PICKUP'
  | 'PICKED_UP'
  | 'EN_ROUTE_TO_CUSTOMER'
  | 'DELIVERED'
  | 'FAILED';

interface BackendCustomer {
  fullName?: string;
}

interface BackendProduct {
  name?: string;
}

interface BackendMenuItem {
  name?: string;
}

interface BackendOrderItem {
  quantity: number;
  product?: BackendProduct | null;
  menuItem?: BackendMenuItem | null;
}

interface BackendOrder {
  id: string;
  type?: 'MARKETPLACE' | 'FOOD';
  status?: string;
  totalAmount?: number | string;
  deliveryFee?: number | string;
  vendorName?: string | null;
  addressLabel?: string | null;
  customer?: BackendCustomer | null;
  items?: BackendOrderItem[];
  createdAt?: string;
}

interface BackendLaundryItem {
  name?: string;
  quantity?: number;
}

interface BackendLaundryOrder {
  id: string;
  status?: string;
  totalAmount?: number | string;
  servicePackage?: string;
  instructions?: string | null;
  addressLabel?: string | null;
  customer?: BackendCustomer | null;
  items?: BackendLaundryItem[];
  createdAt?: string;
}

interface BackendDelivery {
  id: string;
  partnerId?: string | null;
  status: BackendDeliveryStatus;
  distanceKm?: number | null;
  createdAt: string;
  updatedAt?: string;
  order?: BackendOrder | null;
  laundryOrder?: BackendLaundryOrder | null;
}

interface JobsState {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;

  loadJobs: () => Promise<void>;
  acceptJob: (id: string) => Promise<void>;
  advanceStage: (id: string) => Promise<void>;
  failJob: (id: string, reason: FailureReason) => Promise<void>;
}

const PIPELINE: Record<JobType, JobStage[]> = {
  MARKETPLACE: [
    'ACCEPTED',
    'EN_ROUTE_TO_PICKUP',
    'PICKED_UP',
    'EN_ROUTE_TO_CUSTOMER',
    'DELIVERED',
    'COMPLETED',
  ],

  LAUNDRY: [
    'ACCEPTED',
    'EN_ROUTE_TO_PICKUP',
    'PICKED_UP',
    'EN_ROUTE_TO_CUSTOMER',
    'DELIVERED',
    'COMPLETED',
  ],

  FOOD: [
    'ACCEPTED',
    'EN_ROUTE_TO_PICKUP',
    'PAY_VENDOR',
    'PICKED_UP',
    'EN_ROUTE_TO_CUSTOMER',
    'DELIVERED',
    'COMPLETED',
  ],
};

export function pipelineFor(type: JobType) {
  return PIPELINE[type];
}

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDeliveryList(value: unknown): BackendDelivery[] {
  if (Array.isArray(value)) {
    return value as BackendDelivery[];
  }

  if (typeof value !== 'object' || value === null) {
    return [];
  }

  const response = value as {
    data?: unknown;
    deliveries?: unknown;
  };

  if (Array.isArray(response.data)) {
    return response.data as BackendDelivery[];
  }

  if (Array.isArray(response.deliveries)) {
    return response.deliveries as BackendDelivery[];
  }

  return [];
}

function getJobType(delivery: BackendDelivery): JobType {
  if (delivery.laundryOrder) {
    return 'LAUNDRY';
  }

  if (delivery.order?.type === 'FOOD') {
    return 'FOOD';
  }

  return 'MARKETPLACE';
}

function getCustomerName(delivery: BackendDelivery): string {
  return (
    delivery.order?.customer?.fullName ??
    delivery.laundryOrder?.customer?.fullName ??
    'Customer'
  );
}

function getPickupLabel(
  delivery: BackendDelivery,
  type: JobType,
): string {
  if (delivery.order?.vendorName) {
    return delivery.order.vendorName;
  }

  if (type === 'FOOD') {
    return 'Food vendor';
  }

  if (type === 'LAUNDRY') {
    return 'Laundry pickup';
  }

  return 'Marketplace pickup';
}

function getDropoffLabel(delivery: BackendDelivery): string {
  return (
    delivery.order?.addressLabel ??
    delivery.laundryOrder?.addressLabel ??
    'Customer drop-off'
  );
}

function getItemsSummary(delivery: BackendDelivery): string {
  if (delivery.laundryOrder) {
    const items = delivery.laundryOrder.items ?? [];

    if (items.length > 0) {
      return items
        .map((item) => {
          const quantity = item.quantity ?? 1;
          const name = item.name ?? 'Laundry item';

          return `${quantity} × ${name}`;
        })
        .join(', ');
    }

    return delivery.laundryOrder.servicePackage ?? 'Laundry order';
  }

  const items = delivery.order?.items ?? [];

  if (items.length === 0) {
    return 'Order';
  }

  return items
    .map((item) => {
      const quantity = item.quantity ?? 1;

      const name =
        item.menuItem?.name ??
        item.product?.name ??
        'Order item';

      return `${quantity} × ${name}`;
    })
    .join(', ');
}

function getDeliveryFee(delivery: BackendDelivery): number {
  return toNumber(delivery.order?.deliveryFee);
}

function mapBackendStatusToStage(
  status: BackendDeliveryStatus,
  available: boolean,
): JobStage {
  if (available && status === 'ASSIGNED') {
    return 'AVAILABLE';
  }

  switch (status) {
    case 'ASSIGNED':
      return 'ACCEPTED';

    case 'EN_ROUTE_TO_PICKUP':
      return 'EN_ROUTE_TO_PICKUP';

    case 'PICKED_UP':
      return 'PICKED_UP';

    case 'EN_ROUTE_TO_CUSTOMER':
      return 'EN_ROUTE_TO_CUSTOMER';

    case 'DELIVERED':
      /*
       * The backend considers DELIVERED the final delivery status.
       * The frontend still has a short DELIVERED → COMPLETED step
       * for its completion screen.
       *
       * When the app reloads after delivery, it becomes COMPLETED.
       */
      return 'COMPLETED';

    case 'FAILED':
      return 'FAILED';

    default:
      return 'ACCEPTED';
  }
}

function mapDeliveryToJob(
  delivery: BackendDelivery,
  mode: PartnerMode,
  available: boolean,
): Job {
  const type = getJobType(delivery);

  const stage = mapBackendStatusToStage(
    delivery.status,
    available,
  );

  const customerName = getCustomerName(delivery);

  const pickupLabel = getPickupLabel(delivery, type);

  const dropoffLabel = getDropoffLabel(delivery);

  return {
    id: delivery.id,
    type,
    stage,
    partnerMode: mode,

    /*
     * GPS/location is intentionally not part of the current MVP.
     * These values only satisfy the existing Job type.
     * The UI will not display or use them for navigation.
     */
    startCoordinate: {
      latitude: 0,
      longitude: 0,
    },

    pickup: {
      label: pickupLabel,
      sub: 'Pickup',
      coordinate: {
        latitude: 0,
        longitude: 0,
      },
    },

    dropoff: {
      label: dropoffLabel,
      sub: customerName,
      coordinate: {
        latitude: 0,
        longitude: 0,
      },
    },

    distanceKm: toNumber(delivery.distanceKm),

    /*
     * ETA requires routing/location services, which are intentionally
     * excluded from the current MVP.
     */
    etaMinutes: 0,

    deliveryFee: getDeliveryFee(delivery),

    itemsSummary: getItemsSummary(delivery),

    customerName,

    /*
     * Delivery codes are not currently implemented by the backend.
     */
    deliveryCode: '',

    createdAt:
      delivery.createdAt ??
      delivery.order?.createdAt ??
      delivery.laundryOrder?.createdAt ??
      new Date().toISOString(),
  };
}

function replaceJob(
  jobs: Job[],
  updatedJob: Job,
): Job[] {
  return jobs.map((job) =>
    job.id === updatedJob.id ? updatedJob : job,
  );
}

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],
  isLoading: false,
  error: null,

  loadJobs: async () => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const [availableResponse, myResponse] = await Promise.all([
        apiFetch<unknown>('/logistics/deliveries/unassigned'),
        apiFetch<unknown>('/logistics/me/deliveries'),
      ]);

      const availableDeliveries =
        normalizeDeliveryList(availableResponse);

      const myDeliveries =
        normalizeDeliveryList(myResponse);

      /*
       * The partner mode will be used when converting the backend
       * delivery into the existing frontend Job model.
       *
       * We import it lazily here to avoid coupling this store's
       * initialization to another Zustand store.
       */
      const { usePartnerStore } = await import(
        '@/src/stores/partnerStore'
      );

      const mode = usePartnerStore.getState().mode;

      const availableJobs = availableDeliveries.map((delivery) =>
        mapDeliveryToJob(
          delivery,
          mode,
          true,
        ),
      );

      const historyJobs = myDeliveries.map((delivery) =>
        mapDeliveryToJob(
          delivery,
          mode,
          false,
        ),
      );

      /*
       * A delivery should only appear once even if the backend
       * responses overlap.
       */
      const jobMap = new Map<string, Job>();

      for (const job of availableJobs) {
        jobMap.set(job.id, job);
      }

      for (const job of historyJobs) {
        jobMap.set(job.id, job);
      }

      set({
        jobs: Array.from(jobMap.values()),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load deliveries.';

      set({
        isLoading: false,
        error: message,
      });

      throw error;
    }
  },

  acceptJob: async (id) => {
    set({
      error: null,
    });

    try {
      const response = await apiFetch<BackendDelivery>(
        `/logistics/deliveries/${id}/claim`,
        {
          method: 'POST',
        },
      );

      const { usePartnerStore } = await import(
        '@/src/stores/partnerStore'
      );

      const mode = usePartnerStore.getState().mode;

      const job = mapDeliveryToJob(
        response,
        mode,
        false,
      );

      set((state) => ({
        jobs: replaceJob(state.jobs, job),
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to accept this delivery.';

      set({
        error: message,
      });

      throw error;
    }
  },

  advanceStage: async (id) => {
    const job = get().jobs.find(
      (item) => item.id === id,
    );

    if (!job) {
      return;
    }

    /*
     * FOOD has one frontend-only step:
     *
     * EN_ROUTE_TO_PICKUP → PAY_VENDOR
     *
     * No backend status is changed here because the backend has
     * no PAY_VENDOR delivery status.
     */
    if (
      job.type === 'FOOD' &&
      job.stage === 'EN_ROUTE_TO_PICKUP'
    ) {
      set((state) => ({
        jobs: state.jobs.map((item) =>
          item.id === id
            ? {
                ...item,
                stage: 'PAY_VENDOR',
              }
            : item,
        ),
      }));

      return;
    }

    /*
     * The PAY_VENDOR step is completed locally, after which the
     * actual backend delivery status becomes PICKED_UP.
     */
    if (job.stage === 'PAY_VENDOR') {
      try {
        const response = await apiFetch<BackendDelivery>(
          `/logistics/deliveries/${id}/status`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              status: 'PICKED_UP',
            }),
          },
        );

        const { usePartnerStore } = await import(
          '@/src/stores/partnerStore'
        );

        const mode = usePartnerStore.getState().mode;

        const updatedJob = mapDeliveryToJob(
          response,
          mode,
          false,
        );

        set((state) => ({
          jobs: replaceJob(state.jobs, updatedJob),
          error: null,
        }));
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to update the delivery.';

        set({
          error: message,
        });

        throw error;
      }

      return;
    }

    let backendStatus: BackendDeliveryStatus | null = null;

    switch (job.stage) {
      case 'ACCEPTED':
        backendStatus = 'EN_ROUTE_TO_PICKUP';
        break;

      case 'EN_ROUTE_TO_PICKUP':
        backendStatus = 'PICKED_UP';
        break;

      case 'PICKED_UP':
        backendStatus = 'EN_ROUTE_TO_CUSTOMER';
        break;

      case 'EN_ROUTE_TO_CUSTOMER':
        backendStatus = 'DELIVERED';
        break;

      case 'DELIVERED':
        /*
         * DELIVERED is the final backend state.
         * COMPLETED is only the frontend completion screen.
         */
        set((state) => ({
          jobs: state.jobs.map((item) =>
            item.id === id
              ? {
                  ...item,
                  stage: 'COMPLETED',
                  completedAt:
                    new Date().toISOString(),
                }
              : item,
          ),
          error: null,
        }));

        return;

      default:
        return;
    }

    try {
      const response = await apiFetch<BackendDelivery>(
        `/logistics/deliveries/${id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: backendStatus,
          }),
        },
      );

      const { usePartnerStore } = await import(
        '@/src/stores/partnerStore'
      );

      const mode = usePartnerStore.getState().mode;

      /*
       * When the backend reaches DELIVERED, keep the local
       * DELIVERED screen visible for one final confirmation step.
       */
      if (backendStatus === 'DELIVERED') {
        set((state) => ({
          jobs: state.jobs.map((item) =>
            item.id === id
              ? {
                  ...item,
                  stage: 'DELIVERED',
                }
              : item,
          ),
          error: null,
        }));

        return;
      }

      const updatedJob = mapDeliveryToJob(
        response,
        mode,
        false,
      );

      set((state) => ({
        jobs: replaceJob(state.jobs, updatedJob),
        error: null,
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update the delivery.';

      set({
        error: message,
      });

      throw error;
    }
  },

  failJob: async (id, reason) => {
    const job = get().jobs.find(
      (item) => item.id === id,
    );

    if (!job) {
      return;
    }

    try {
      await apiFetch<BackendDelivery>(
        `/logistics/deliveries/${id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'FAILED',
          }),
        },
      );

      set((state) => ({
        jobs: state.jobs.map((item) =>
          item.id === id
            ? {
                ...item,
                stage: 'FAILED',
                failureReason: reason,
                failedAt: new Date().toISOString(),
              }
            : item,
        ),
        error: null,
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to mark this delivery as failed.';

      set({
        error: message,
      });

      throw error;
    }
  },
}));

export function selectPartnerRating(jobs: Job[]) {
  const rated = jobs.filter(
    (job) =>
      job.stage === 'COMPLETED' &&
      job.rating != null,
  );

  if (rated.length === 0) {
    return {
      average: 0,
      count: 0,
    };
  }

  const total = rated.reduce(
    (sum, job) => sum + (job.rating ?? 0),
    0,
  );

  return {
    average: total / rated.length,
    count: rated.length,
  };
}
