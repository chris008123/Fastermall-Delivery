import { router } from 'expo-router';
import { Bike, ChevronRight, Footprints, History, MapPin, PackageSearch, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { Badge } from '@/src/shared/components/Badge';
import { GlassView } from '@/src/shared/components/GlassView';
import { StarRating } from '@/src/shared/components/StarRating';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useJobsStore } from '@/src/stores/jobsStore';
import { usePartnerStore } from '@/src/stores/partnerStore';
import { colors } from '@/src/theme';
import type { Job } from '@/src/types/job';
import { formatCurrency } from '@/src/utils/money';

type JobsView = 'available' | 'history';

export default function JobsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const [view, setView] = useState<JobsView>('available');

  const isAvailable = usePartnerStore((s) => s.isAvailable);
  const jobs = useJobsStore((s) => s.jobs);
  const hasActiveJob = jobs.some((j) => j.stage !== 'AVAILABLE' && j.stage !== 'COMPLETED' && j.stage !== 'FAILED');
  const openJobs = jobs.filter((j) => j.stage === 'AVAILABLE');
  const history = jobs
    .filter((j) => j.stage === 'COMPLETED' || j.stage === 'FAILED')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

  const segmented = (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
      <SegmentButton label="Available" active={view === 'available'} onPress={() => setView('available')} theme={theme} />
      <SegmentButton label="History" active={view === 'history'} onPress={() => setView('history')} theme={theme} />
    </View>
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

  if (view === 'history') {
    return (
      <FlatList<Job>
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}
        data={history}
        keyExtractor={(j) => j.id}
        ListHeaderComponent={
          <View style={{ gap: 4, marginBottom: 4 }}>
            <Text className="text-h1 font-bold" style={{ color: theme.text }}>Jobs</Text>
            {segmented}
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
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}
      data={openJobs}
      keyExtractor={(j) => j.id}
      ListHeaderComponent={
        <View style={{ gap: 4, marginBottom: 4 }}>
          <Text className="text-h1 font-bold" style={{ color: theme.text }}>Jobs</Text>
          {segmented}
          <Text className="text-caption font-medium" style={{ color: theme.textSecondary, marginTop: 4 }}>
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
        <JobCard job={item} disabled={hasActiveJob} onPress={() => router.push(`/jobs/${item.id}`)} />
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
        <Text
          className="text-caption font-semibold"
          style={{ color: active ? colors.partner.orange : theme.textSecondary }}
        >
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

function JobCard({ job, disabled, onPress }: { job: Job; disabled: boolean; onPress: () => void }) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const ModeIcon = job.partnerMode === 'MOTORCYCLE' ? Bike : Footprints;

  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.98} disabled={disabled}>
      <GlassView radius="card" style={{ padding: 16, gap: 10, opacity: disabled ? 0.5 : 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Badge jobType={job.type} label={job.type} />
          <Text className="text-card-title font-bold" style={{ color: colors.jobType[job.type].dark }}>
            {formatCurrency(job.deliveryFee)}
          </Text>
        </View>

        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MapPin size={14} color={theme.textSecondary} />
            <Text className="text-body font-medium" style={{ color: theme.text }} numberOfLines={1}>
              {job.pickup.label}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ChevronRight size={14} color={theme.textSecondary} />
            <Text className="text-body" style={{ color: theme.textSecondary }} numberOfLines={1}>
              {job.dropoff.label}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ModeIcon size={14} color={theme.textSecondary} />
            <Text className="text-caption" style={{ color: theme.textSecondary }}>
              {job.distanceKm.toFixed(1)} km \u00b7 ~{job.etaMinutes} min
            </Text>
          </View>
          {disabled && (
            <Text className="text-caption font-medium" style={{ color: theme.textSecondary }}>
              Finish active job first
            </Text>
          )}
        </View>
      </GlassView>
    </AnimatedPressable>
  );
}

function HistoryCard({ job }: { job: Job }) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const total = job.deliveryFee + (job.vendorPayoutAmount ?? 0);

  return (
    <GlassView radius="card" style={{ padding: 16, gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Badge jobType={job.type} label={job.type} />
        {job.stage === 'FAILED' ? (
          <Text className="text-caption font-semibold" style={{ color: colors.semantic.error }}>Failed</Text>
        ) : (
          <Text className="text-card-title font-bold" style={{ color: theme.text }}>{formatCurrency(total)}</Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <MapPin size={14} color={theme.textSecondary} />
        <Text className="text-body font-medium" style={{ color: theme.text }} numberOfLines={1}>
          {job.pickup.label} \u2192 {job.dropoff.label}
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
    </GlassView>
  );
}
