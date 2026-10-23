import { router } from 'expo-router';
import { Bike, ChevronRight, CircleAlert, Footprints, History, MapPin, PackageSearch, Zap } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { Badge } from '@/src/shared/components/Badge';
import { GlassView } from '@/src/shared/components/GlassView';
import { NAV_BAR_CLEARANCE } from '@/src/shared/components/FloatingNav';
import { StarRating } from '@/src/shared/components/StarRating';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useJobsStore } from '@/src/stores/jobsStore';
import { usePartnerStore } from '@/src/stores/partnerStore';
import { colors } from '@/src/theme';
import type { Job } from '@/src/types/job';
import { formatCurrency } from '@/src/utils/money';

// Layout ported from the app's GlassView design system, same merge pattern
// as the Home screen: the real backend-connected data layer below
// (loadJobs(), isLoading/error, pull-to-refresh) is unchanged — only the
// presentation is new. Per the redesign brief's Jobs-list rules: job-type
// color reads as a left-edge accent/icon tint rather than a full-card wash,
// addresses truncate to one line, fare is right-aligned, and disabled
// (already-has-an-active-job) cards visually shade back.

type JobsView = 'available' | 'history';
type SortOption = 'HIGHEST_PAY' | 'CLOSEST' | 'SHORTEST';

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
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  const [view, setView] = useState<JobsView>('available');
  const [sortBy, setSortBy] = useState<SortOption>('HIGHEST_PAY');
  const [refreshing, setRefreshing] = useState(false);

  const isAvailable = usePartnerStore((s) => s.isAvailable);
  const jobs = useJobsStore((s) => s.jobs);
  const isLoading = useJobsStore((s) => s.isLoading);
  const error = useJobsStore((s) => s.error);
  const loadJobs = useJobsStore((s) => s.loadJobs);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

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

  const openJobs = useMemo(
    () =>
      sortJobs(
        jobs.filter((j) => j.stage === 'AVAILABLE' && j.type === 'FOOD'),
        sortBy,
      ),
    [jobs, sortBy],
  );

  const history = useMemo(
    () =>
      jobs
        .filter((j) => j.stage === 'COMPLETED' || j.stage === 'FAILED')
        .sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt)),
    [jobs],
  );

  const openJob = (id: string) => router.push(`/(partner)/jobs/${id}`);

  const segmented = (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
      <SegmentButton label="Available" active={view === 'available'} onPress={() => setView('available')} theme={theme} />
      <SegmentButton label="History" active={view === 'history'} onPress={() => setView('history')} theme={theme} />
    </View>
  );

  const errorBanner = error && (
    <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
      <CircleAlert size={19} color={colors.semantic.error} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text className="text-body-lg font-semibold" style={{ color: colors.semantic.error }}>
          Couldn't load jobs
        </Text>
        <Text className="text-caption" style={{ color: theme.textSecondary }}>{error}</Text>
        <AnimatedPressable onPress={() => void loadJobs()} scaleTo={0.97} style={{ alignSelf: 'flex-start', marginTop: 6 }}>
          <Text className="text-caption font-semibold" style={{ color: colors.partner.orange }}>Try again</Text>
        </AnimatedPressable>
      </View>
    </GlassView>
  );

  if (view === 'available' && !isAvailable) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: insets.top + 16, paddingHorizontal: 20, gap: 16 }}>
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>Jobs</Text>
        {segmented}
        <GlassView radius="card" style={{ padding: 20, gap: 8, alignItems: 'flex-start' }}>
          <Zap size={22} color={colors.partner.orange} />
          <Text className="text-card-title font-semibold" style={{ color: theme.text }}>You're offline</Text>
          <Text className="text-body" style={{ color: theme.textSecondary }}>
            Go online from the Home tab to see jobs near you.
          </Text>
        </GlassView>
      </View>
    );
  }

  if (view === 'available' && isLoading && jobs.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: insets.top + 16, paddingHorizontal: 20, gap: 16 }}>
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>Jobs</Text>
        {segmented}
        <GlassView radius="card" style={{ padding: 20, alignItems: 'center', gap: 8 }}>
          <ActivityIndicator color={colors.partner.orange} />
          <Text className="text-caption" style={{ color: theme.textSecondary }}>Checking for nearby jobs…</Text>
        </GlassView>
      </View>
    );
  }

  if (view === 'history') {
    return (
      <FlatList<Job>
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: insets.bottom + NAV_BAR_CLEARANCE, gap: 12 }}
        data={history}
        keyExtractor={(j) => j.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.partner.orange} colors={[colors.partner.orange]} />}
        ListHeaderComponent={
          <View style={{ gap: 4, marginBottom: 4 }}>
            <Text className="text-h1 font-bold" style={{ color: theme.text }}>Jobs</Text>
            {segmented}
            {errorBanner}
          </View>
        }
        ListEmptyComponent={
          <GlassView radius="card" style={{ padding: 20, alignItems: 'flex-start', gap: 8 }}>
            <History size={20} color={theme.textSecondary} />
            <Text className="text-body" style={{ color: theme.textSecondary }}>
              No completed deliveries yet — they'll show up here once you finish your first job.
            </Text>
          </GlassView>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => <HistoryCard job={item} />}
      />
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: insets.bottom + NAV_BAR_CLEARANCE, gap: 12 }}
      data={openJobs}
      keyExtractor={(j) => j.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.partner.orange} colors={[colors.partner.orange]} />}
      ListHeaderComponent={
        <View style={{ gap: 4, marginBottom: 4 }}>
          <Text className="text-h1 font-bold" style={{ color: theme.text }}>Jobs</Text>
          {segmented}
          {errorBanner}

          <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8, marginTop: 10 }}>
            SORT BY
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SORT_OPTIONS.map(({ value, label }) => (
              <FilterChip key={value} label={label} active={sortBy === value} onPress={() => setSortBy(value)} theme={theme} />
            ))}
          </View>

          <Text className="text-caption font-medium" style={{ color: theme.textSecondary, marginTop: 8 }}>
            {openJobs.length} job{openJobs.length === 1 ? '' : 's'} near you
          </Text>
        </View>
      }
      ListEmptyComponent={
        <GlassView radius="card" style={{ padding: 20, alignItems: 'flex-start', gap: 8 }}>
          <PackageSearch size={20} color={theme.textSecondary} />
          <Text className="text-body" style={{ color: theme.textSecondary }}>
            No open jobs right now — check back in a bit.
          </Text>
        </GlassView>
      }
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={({ item }) => (
        <JobCard job={item} disabled={hasActiveJob} onPress={() => openJob(item.id)} />
      )}
    />
  );
}

function SegmentButton({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: { border: string; textSecondary: string };
}) {
  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.96}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: active ? colors.partner.orangeTint : 'transparent',
          borderWidth: 1.5,
          borderColor: active ? colors.partner.orange : theme.border,
        }}
      >
        <Text className="text-caption font-semibold" style={{ color: active ? colors.partner.orange : theme.textSecondary }}>
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: { border: string; textSecondary: string };
}) {
  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.96}>
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 999,
          backgroundColor: active ? colors.partner.orangeTint : 'transparent',
          borderWidth: 1.5,
          borderColor: active ? colors.partner.orange : theme.border,
        }}
      >
        <Text className="text-caption font-semibold" style={{ color: active ? colors.partner.orange : theme.textSecondary }}>
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

// job-type color reads as a left-edge accent, not a full-card wash — the
// bar sits inside the GlassView's rounded corners rather than the whole
// card being tinted.
function JobCard({ job, disabled, onPress }: { job: Job; disabled: boolean; onPress: () => void }) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const ModeIcon = job.partnerMode === 'MOTORCYCLE' ? Bike : Footprints;
  const accent = colors.jobType[job.type].bright;

  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.98} disabled={disabled}>
      <GlassView radius="card" style={{ padding: 0, opacity: disabled ? 0.5 : 1, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ width: 4, backgroundColor: accent }} />
          <View style={{ flex: 1, padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge jobType={job.type} label={job.type} />
              <Text className="text-card-title font-bold" style={{ color: theme.text }}>
                {formatCurrency(job.deliveryFee)}
              </Text>
            </View>

            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color={theme.textSecondary} />
                <Text className="text-body font-medium" style={{ color: theme.text, flexShrink: 1 }} numberOfLines={1}>
                  {job.pickup.label}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ChevronRight size={14} color={theme.textSecondary} />
                <Text className="text-body" style={{ color: theme.textSecondary, flexShrink: 1 }} numberOfLines={1}>
                  {job.dropoff.label}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ModeIcon size={14} color={theme.textSecondary} />
                <Text className="text-caption" style={{ color: theme.textSecondary }}>
                  {`${job.distanceKm.toFixed(1)} km \u00b7 ~${job.etaMinutes} min`}
                </Text>
              </View>
              {disabled && (
                <Text className="text-caption font-medium" style={{ color: theme.textSecondary }}>
                  Finish active job first
                </Text>
              )}
            </View>
          </View>
        </View>
      </GlassView>
    </AnimatedPressable>
  );
}

function HistoryCard({ job }: { job: Job }) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const total = job.deliveryFee + (job.vendorPayoutAmount ?? 0);
  const isFailed = job.stage === 'FAILED';
  const accent = isFailed ? colors.semantic.error : colors.jobType[job.type].bright;

  return (
    <GlassView radius="card" style={{ padding: 0, overflow: 'hidden', opacity: isFailed ? 0.7 : 1 }}>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 4, backgroundColor: accent }} />
        <View style={{ flex: 1, padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Badge jobType={job.type} label={job.type} />
            {isFailed ? (
              <Text className="text-caption font-semibold" style={{ color: colors.semantic.error }}>Failed</Text>
            ) : (
              <Text className="text-card-title font-bold" style={{ color: theme.text }}>{formatCurrency(total)}</Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MapPin size={14} color={theme.textSecondary} />
            <Text className="text-body font-medium" style={{ color: theme.text, flexShrink: 1 }} numberOfLines={1}>
              {`${job.pickup.label} \u2192 ${job.dropoff.label}`}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text className="text-caption" style={{ color: theme.textSecondary }}>
              {job.completedAt
                ? new Date(job.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : '\u2014'}
              {'  \u00b7  '}
              {job.customerName}
            </Text>
            {job.rating != null && <StarRating rating={job.rating} size={13} />}
          </View>
        </View>
      </View>
    </GlassView>
  );
}
