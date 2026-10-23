import { router } from 'expo-router';
import { Bike, Footprints } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, View } from 'react-native';
import { haptics } from '@/src/ds/haptics';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import { StarRating } from '@/src/shared/components/StarRating';
import { useToast } from '@/src/shared/toast/ToastProvider';
import { useJobsStore } from '@/src/stores/jobsStore';
import { usePartnerStore } from '@/src/stores/partnerStore';
import type { Job } from '@/src/types/job';
import { formatCurrency } from '@/src/utils/money';
import { useNavClearance } from '@/src/ui/AppNav';
import { Chip } from '@/src/ui/Chip';
import { Notice } from '@/src/ui/Notice';
import { Panel } from '@/src/ui/Panel';
import { RouteLine } from '@/src/ui/RouteLine';
import { ScreenHeader } from '@/src/ui/ScreenHeader';
import { Segmented } from '@/src/ui/Segmented';
import { JobTag, Tag } from '@/src/ui/Tag';

// Data loading (loadJobs, loading/error state, pull-to-refresh) is the same
// backend-connected layer as before; only the presentation is new. The job
// type shows as a left edge in its identity color and a tag, never a
// wash across the card. Addresses stay on one line, fare is right-aligned,
// and cards shade back when the partner already has an active job.

type JobsView = 'available' | 'history';
type TypeFilter = 'ALL' | Job['type'];
type SortOption = 'HIGHEST_PAY' | 'CLOSEST' | 'SHORTEST';

const VIEW_OPTIONS: { value: JobsView; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'history', label: 'History' },
];

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'MARKETPLACE', label: 'Marketplace' },
  { value: 'FOOD', label: 'Food' },
  { value: 'LAUNDRY', label: 'Laundry' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'HIGHEST_PAY', label: 'Highest pay' },
  { value: 'CLOSEST', label: 'Closest' },
  { value: 'SHORTEST', label: 'Shortest' },
];

function sortJobs(jobs: Job[], sortBy: SortOption): Job[] {
  const sorted = [...jobs];
  if (sortBy === 'HIGHEST_PAY') sorted.sort((a, b) => b.deliveryFee - a.deliveryFee);
  if (sortBy === 'CLOSEST') sorted.sort((a, b) => a.distanceKm - b.distanceKm);
  if (sortBy === 'SHORTEST') sorted.sort((a, b) => a.etaMinutes - b.etaMinutes);
  return sorted;
}

export default function JobsScreen() {
  const { t } = useTheme();
  const navClearance = useNavClearance();

  const [view, setView] = useState<JobsView>('available');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('HIGHEST_PAY');
  const [refreshing, setRefreshing] = useState(false);

  const isAvailable = usePartnerStore((s) => s.isAvailable);
  const jobs = useJobsStore((s) => s.jobs);
  const isLoading = useJobsStore((s) => s.isLoading);
  const error = useJobsStore((s) => s.error);
  const loadJobs = useJobsStore((s) => s.loadJobs);
  const { show } = useToast();

  // Jobs that showed up after this screen first loaded. They get a "New"
  // tag and one haptic + toast, so a refresh that brings in work is obvious.
  const seenRef = useRef<Set<string> | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    void loadJobs().finally(() => {
      seenRef.current = new Set(
        useJobsStore.getState().jobs.filter((j) => j.stage === 'AVAILABLE').map((j) => j.id),
      );
    });
  }, [loadJobs]);

  useEffect(() => {
    const seen = seenRef.current;
    if (!seen) return;
    const fresh = jobs.filter((j) => j.stage === 'AVAILABLE' && !seen.has(j.id)).map((j) => j.id);
    if (fresh.length === 0) return;
    fresh.forEach((id) => seen.add(id));
    setNewIds((prev) => new Set([...prev, ...fresh]));
    haptics.light();
    show(`${fresh.length} new job${fresh.length === 1 ? '' : 's'} available`, 'info');
  }, [jobs, show]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadJobs();
    } finally {
      setRefreshing(false);
    }
  };

  const hasActiveJob = useMemo(
    () => jobs.some((j) => j.stage !== 'AVAILABLE' && j.stage !== 'COMPLETED' && j.stage !== 'FAILED'),
    [jobs],
  );

  const typeCounts = useMemo(() => {
    const available = jobs.filter((j) => j.stage === 'AVAILABLE');
    return {
      ALL: available.length,
      MARKETPLACE: available.filter((j) => j.type === 'MARKETPLACE').length,
      FOOD: available.filter((j) => j.type === 'FOOD').length,
      LAUNDRY: available.filter((j) => j.type === 'LAUNDRY').length,
    } satisfies Record<TypeFilter, number>;
  }, [jobs]);

  const openJobs = useMemo(
    () =>
      sortJobs(
        jobs.filter((j) => j.stage === 'AVAILABLE' && (typeFilter === 'ALL' || j.type === typeFilter)),
        sortBy,
      ),
    [jobs, typeFilter, sortBy],
  );

  const history = useMemo(
    () =>
      jobs
        .filter((j) => j.stage === 'COMPLETED' || j.stage === 'FAILED')
        .sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt)),
    [jobs],
  );

  const openJob = (id: string) => router.push(`/(partner)/jobs/${id}`);

  const header = (
    <>
      <ScreenHeader title="Jobs" />
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <Segmented options={VIEW_OPTIONS} value={view} onChange={setView} accessibilityLabel="Jobs view" />
      </View>
    </>
  );

  const errorNotice = error ? (
    <Notice title="Couldn't load jobs" message={error} actionLabel="Try again" onAction={() => void loadJobs()} />
  ) : null;

  const frame = (children: ReactNode) => (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {header}
      <View style={{ paddingHorizontal: 20, gap: 16 }}>{children}</View>
    </View>
  );

  if (view === 'available' && !isAvailable) {
    return frame(
      <Panel style={{ gap: 4 }}>
        <Txt variant="heading">You're offline</Txt>
        <Txt variant="body" tone="secondary">
          Slide to go online on the Home tab to see jobs near you.
        </Txt>
      </Panel>,
    );
  }

  if (view === 'available' && isLoading && jobs.length === 0) {
    return frame(
      <Panel style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <ActivityIndicator color={t.primary} />
        <Txt variant="body" tone="secondary">
          Checking for nearby jobs…
        </Txt>
      </Panel>,
    );
  }

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={t.primary} colors={[t.primary]} />
  );

  if (view === 'history') {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        {header}
        <FlatList<Job>
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: navClearance }}
          data={history}
          keyExtractor={(j) => j.id}
          refreshControl={refreshControl}
          ListHeaderComponent={errorNotice ? <View style={{ marginBottom: 12 }}>{errorNotice}</View> : null}
          ListEmptyComponent={
            <Panel style={{ gap: 4 }}>
              <Txt variant="heading">No deliveries yet</Txt>
              <Txt variant="body" tone="secondary">
                Finished jobs will show up here, with what you earned on each.
              </Txt>
            </Panel>
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => <HistoryCard job={item} />}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {header}
      <FlatList<Job>
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: navClearance }}
        data={openJobs}
        keyExtractor={(j) => j.id}
        refreshControl={refreshControl}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 14 }}>
            {errorNotice}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -20 }}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
            >
              {TYPE_FILTERS.map(({ value, label }) => (
                <Chip
                  key={value}
                  label={`${label} ${typeCounts[value]}`}
                  selected={typeFilter === value}
                  onPress={() => setTypeFilter(value)}
                />
              ))}
            </ScrollView>
            <View style={{ gap: 6 }}>
              <Txt variant="label" tone="secondary">
                Sort by
              </Txt>
              <Segmented options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} accessibilityLabel="Sort jobs by" />
            </View>
            <Txt variant="caption" tone="secondary">
              {openJobs.length} job{openJobs.length === 1 ? '' : 's'} near you
            </Txt>
          </View>
        }
        ListEmptyComponent={
          <Panel style={{ gap: 4 }}>
            <Txt variant="heading">No open jobs right now</Txt>
            <Txt variant="body" tone="secondary">
              Pull down to refresh, or check back in a bit.
            </Txt>
          </Panel>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <JobCard job={item} disabled={hasActiveJob} isNew={newIds.has(item.id)} onPress={() => openJob(item.id)} />
        )}
      />
    </View>
  );
}

/** Left edge in the job type's color; everything else is flat. */
function CardFrame({ accent, children }: { accent: string; children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      <View style={{ width: 4, backgroundColor: accent }} />
      <View style={{ flex: 1, padding: 16, gap: 14 }}>{children}</View>
    </View>
  );
}

function JobCard({ job, disabled, isNew, onPress }: { job: Job; disabled: boolean; isNew: boolean; onPress: () => void }) {
  const { t, job: jobColors } = useTheme();
  const colors = jobColors(job.type);
  const ModeIcon = job.partnerMode === 'MOTORCYCLE' ? Bike : Footprints;

  return (
    <Panel
      padding={0}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={`${job.type.toLowerCase()} job, ${formatCurrency(job.deliveryFee)}, ${job.distanceKm.toFixed(1)} kilometres`}
      style={{ overflow: 'hidden', opacity: disabled ? 0.5 : 1 }}
    >
      <CardFrame accent={colors.solid}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <JobTag jobType={job.type} />
            {isNew ? <Tag label="New" tone="go" dot /> : null}
          </View>
          <Txt variant="heading" style={{ fontVariant: ['tabular-nums'] }}>
            {formatCurrency(job.deliveryFee)}
          </Txt>
        </View>

        <RouteLine compact color={colors.solid} pickup={{ title: job.pickup.label }} dropoff={{ title: job.dropoff.label }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ModeIcon size={16} color={t.inkSecondary} />
            <Txt variant="caption" tone="secondary" style={{ fontVariant: ['tabular-nums'] }}>
              {`${job.distanceKm.toFixed(1)} km · about ${job.etaMinutes} min`}
            </Txt>
          </View>
          {disabled ? (
            <Txt variant="caption" tone="secondary">
              Finish your active job first
            </Txt>
          ) : null}
        </View>
      </CardFrame>
    </Panel>
  );
}

function HistoryCard({ job }: { job: Job }) {
  const { t, job: jobColors } = useTheme();
  const total = job.deliveryFee + (job.vendorPayoutAmount ?? 0);
  const isFailed = job.stage === 'FAILED';
  const accent = isFailed ? t.alert : jobColors(job.type).solid;

  return (
    <Panel padding={0} style={{ overflow: 'hidden', opacity: isFailed ? 0.75 : 1 }}>
      <CardFrame accent={accent}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <JobTag jobType={job.type} />
          {isFailed ? (
            <Tag label="Failed" tone="alert" />
          ) : (
            <Txt variant="heading" style={{ fontVariant: ['tabular-nums'] }}>
              {formatCurrency(total)}
            </Txt>
          )}
        </View>

        <RouteLine compact color={accent} pickup={{ title: job.pickup.label }} dropoff={{ title: job.dropoff.label }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Txt variant="caption" tone="secondary" style={{ flexShrink: 1 }} numberOfLines={1}>
            {job.completedAt
              ? new Date(job.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              : '—'}
            {' · '}
            {job.customerName}
          </Txt>
          {job.rating != null && <StarRating rating={job.rating} size={13} mutedColor={t.lineStrong} />}
        </View>
      </CardFrame>
    </Panel>
  );
}
