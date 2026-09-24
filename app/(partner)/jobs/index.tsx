import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ChevronRight,
  Clock3,
  DollarSign,
  Package,
  RefreshCw,
  Store,
} from 'lucide-react-native';

import { useJobsStore } from '@/src/stores/jobsStore';
import { usePartnerStore } from '@/src/stores/partnerStore';
import type { Job, JobType } from '@/src/types/job';
import { formatCurrency } from '@/src/utils/money';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme/colors';

type Filter = 'ALL' | JobType;
type SortOption = 'HIGHEST_PAY';

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Marketplace', value: 'MARKETPLACE' },
  { label: 'Food', value: 'FOOD' },
  { label: 'Laundry', value: 'LAUNDRY' },
];

function getTypeLabel(type: JobType) {
  switch (type) {
    case 'FOOD':
      return 'Food';

    case 'LAUNDRY':
      return 'Laundry';

    case 'MARKETPLACE':
      return 'Marketplace';

    default:
      return type;
  }
}

function getTypeIcon(type: JobType) {
  switch (type) {
    case 'FOOD':
      return Store;

    case 'LAUNDRY':
      return Package;

    case 'MARKETPLACE':
    default:
      return Package;
  }
}

function JobCard({
  job,
  onPress,
}: {
  job: Job;
  onPress: () => void;
}) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  const TypeIcon = getTypeIcon(job.type);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.jobCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.jobCardHeader}>
        <View style={styles.jobTypeRow}>
          <View
            style={[
              styles.typeIcon,
              {
                backgroundColor: theme.background,
              },
            ]}
          >
            <TypeIcon
              size={18}
              color={theme.primary}
            />
          </View>

          <View>
            <Text
              style={[
                styles.jobType,
                { color: theme.text },
              ]}
            >
              {getTypeLabel(job.type)}
            </Text>

            <Text
              style={[
                styles.jobSubtext,
                { color: theme.mutedText },
              ]}
            >
              Delivery job
            </Text>
          </View>
        </View>

        <View style={styles.feeContainer}>
          <DollarSign
            size={15}
            color={theme.primary}
          />

          <Text
            style={[
              styles.fee,
              { color: theme.primary },
            ]}
          >
            {formatCurrency(job.deliveryFee)}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.routeContainer,
          {
            borderTopColor: theme.border,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.routeRow}>
          <View
            style={[
              styles.routeDot,
              { backgroundColor: theme.primary },
            ]}
          />

          <View style={styles.routeText}>
            <Text
              style={[
                styles.routeLabel,
                { color: theme.mutedText },
              ]}
            >
              PICKUP
            </Text>

            <Text
              numberOfLines={1}
              style={[
                styles.routeValue,
                { color: theme.text },
              ]}
            >
              {job.pickup.label}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.routeLine,
            { backgroundColor: theme.border },
          ]}
        />

        <View style={styles.routeRow}>
          <View
            style={[
              styles.routeDot,
              { backgroundColor: theme.text },
            ]}
          />

          <View style={styles.routeText}>
            <Text
              style={[
                styles.routeLabel,
                { color: theme.mutedText },
              ]}
            >
              DROP-OFF
            </Text>

            <Text
              numberOfLines={1}
              style={[
                styles.routeValue,
                { color: theme.text },
              ]}
            >
              {job.dropoff.label}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.jobFooter}>
        <View style={styles.footerInfo}>
          <Clock3
            size={15}
            color={theme.mutedText}
          />

          <Text
            style={[
              styles.footerText,
              { color: theme.mutedText },
            ]}
          >
            {job.partnerMode === 'MOTORCYCLE'
              ? 'Motorcycle'
              : 'Walking'}
          </Text>
        </View>

        <View style={styles.viewJob}>
          <Text
            style={[
              styles.viewJobText,
              { color: theme.primary },
            ]}
          >
            View job
          </Text>

          <ChevronRight
            size={17}
            color={theme.primary}
          />
        </View>
      </View>
    </Pressable>
  );
}

function HistoryCard({
  job,
  onPress,
}: {
  job: Job;
  onPress: () => void;
}) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  const isFailed = job.stage === 'FAILED';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.historyCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.historyMain}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.historyType,
              { color: theme.text },
            ]}
          >
            {getTypeLabel(job.type)}
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.historyRoute,
              { color: theme.mutedText },
            ]}
          >
            {job.pickup.label} → {job.dropoff.label}
          </Text>
        </View>

        <View style={styles.historyRight}>
          <Text
            style={[
              styles.historyAmount,
              {
                color: isFailed
                  ? theme.mutedText
                  : theme.text,
              },
            ]}
          >
            {formatCurrency(job.deliveryFee)}
          </Text>

          <Text
            style={[
              styles.historyStatus,
              {
                color: isFailed
                  ? theme.danger
                  : theme.primary,
              },
            ]}
          >
            {isFailed ? 'Failed' : 'Completed'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function JobsScreen() {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  const jobs = useJobsStore((state) => state.jobs);
  const isLoading = useJobsStore(
    (state) => state.isLoading,
  );
  const error = useJobsStore(
    (state) => state.error,
  );
  const loadJobs = useJobsStore(
    (state) => state.loadJobs,
  );

  const isAvailable = usePartnerStore(
    (state) => state.isAvailable,
  );

  const [filter, setFilter] = useState<Filter>('ALL');
  const [sort, setSort] =
    useState<SortOption>('HIGHEST_PAY');
  const [showHistory, setShowHistory] =
    useState(false);
  const [refreshing, setRefreshing] =
    useState(false);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const activeJob = useMemo(
    () =>
      jobs.find(
        (job) =>
          ![
            'AVAILABLE',
            'COMPLETED',
            'FAILED',
          ].includes(job.stage),
      ),
    [jobs],
  );

  const availableJobs = useMemo(() => {
    let result = jobs.filter(
      (job) => job.stage === 'AVAILABLE',
    );

    if (filter !== 'ALL') {
      result = result.filter(
        (job) => job.type === filter,
      );
    }

    if (sort === 'HIGHEST_PAY') {
      result.sort(
        (a, b) =>
          b.deliveryFee - a.deliveryFee,
      );
    }

    return result;
  }, [jobs, filter, sort]);

  const historyJobs = useMemo(
    () =>
      jobs
        .filter(
          (job) =>
            job.stage === 'COMPLETED' ||
            job.stage === 'FAILED',
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        ),
    [jobs],
  );

  const refresh = async () => {
    setRefreshing(true);

    try {
      await loadJobs();
    } finally {
      setRefreshing(false);
    }
  };

  const openJob = (id: string) => {
    router.push(`/(partner)/jobs/${id}`);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.primary}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text
              style={[
                styles.title,
                { color: theme.text },
              ]}
            >
              Deliveries
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: theme.mutedText },
              ]}
            >
              {isAvailable
                ? 'Available delivery jobs'
                : 'Go online to receive jobs'}
            </Text>
          </View>

          <Pressable
            onPress={() => void refresh()}
            style={[
              styles.refreshButton,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <RefreshCw
              size={18}
              color={theme.text}
            />
          </Pressable>
        </View>

        {activeJob && (
          <Pressable
            onPress={() =>
              router.push(
                `/(partner)/active/${activeJob.id}`,
              )
            }
            style={[
              styles.activeBanner,
              {
                backgroundColor: theme.primary,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.activeBannerTitle}>
                Active delivery
              </Text>

              <Text
                numberOfLines={1}
                style={styles.activeBannerText}
              >
                {activeJob.pickup.label} →{' '}
                {activeJob.dropoff.label}
              </Text>
            </View>

            <ChevronRight
              size={22}
              color="#FFFFFF"
            />
          </Pressable>
        )}

        {!isAvailable &&
          !activeJob &&
          !isLoading && (
            <View
              style={[
                styles.offlineCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.offlineTitle,
                  { color: theme.text },
                ]}
              >
                You're offline
              </Text>

              <Text
                style={[
                  styles.offlineText,
                  { color: theme.mutedText },
                ]}
              >
                Go online from the home screen to
                receive available delivery jobs.
              </Text>
            </View>
          )}

        {error && jobs.length === 0 && (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.errorTitle,
                { color: theme.text },
              ]}
            >
              Unable to load deliveries
            </Text>

            <Text
              style={[
                styles.errorText,
                { color: theme.mutedText },
              ]}
            >
              {error}
            </Text>

            <Pressable
              onPress={() => void loadJobs()}
              style={[
                styles.retryButton,
                {
                  backgroundColor: theme.primary,
                },
              ]}
            >
              <Text style={styles.retryText}>
                Try again
              </Text>
            </Pressable>
          </View>
        )}

        {isLoading && jobs.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={theme.primary}
            />

            <Text
              style={[
                styles.loadingText,
                { color: theme.mutedText },
              ]}
            >
              Loading deliveries...
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.text },
                  ]}
                >
                  Available jobs
                </Text>

                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: theme.mutedText },
                  ]}
                >
                  {availableJobs.length}{' '}
                  {availableJobs.length === 1
                    ? 'job'
                    : 'jobs'}{' '}
                  available
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setSort('HIGHEST_PAY')
                }
              >
                <Text
                  style={[
                    styles.sortText,
                    { color: theme.primary },
                  ]}
                >
                  Highest pay
                </Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.filterRow
              }
            >
              {FILTERS.map((item) => {
                const selected =
                  filter === item.value;

                return (
                  <Pressable
                    key={item.value}
                    onPress={() =>
                      setFilter(item.value)
                    }
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: selected
                          ? theme.primary
                          : theme.card,
                        borderColor:
                          selected
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        {
                          color: selected
                            ? '#FFFFFF'
                            : theme.text,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {availableJobs.length > 0 ? (
              <View style={styles.list}>
                {availableJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onPress={() => openJob(job.id)}
                  />
                ))}
              </View>
            ) : (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Package
                  size={30}
                  color={theme.mutedText}
                />

                <Text
                  style={[
                    styles.emptyTitle,
                    { color: theme.text },
                  ]}
                >
                  No jobs available
                </Text>

                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.mutedText },
                  ]}
                >
                  New delivery jobs will appear here
                  when they become available.
                </Text>
              </View>
            )}

            <Pressable
              onPress={() =>
                setShowHistory((value) => !value)
              }
              style={styles.historyToggle}
            >
              <Text
                style={[
                  styles.historyToggleText,
                  { color: theme.primary },
                ]}
              >
                {showHistory
                  ? 'Hide delivery history'
                  : `View delivery history (${historyJobs.length})`}
              </Text>

              <ChevronRight
                size={17}
                color={theme.primary}
                style={{
                  transform: [
                    {
                      rotate: showHistory
                        ? '90deg'
                        : '0deg',
                    },
                  ],
                }}
              />
            </Pressable>

            {showHistory && (
              <View style={styles.historyList}>
                {historyJobs.length > 0 ? (
                  historyJobs.map((job) => (
                    <HistoryCard
                      key={job.id}
                      job={job}
                      onPress={() => openJob(job.id)}
                    />
                  ))
                ) : (
                  <Text
                    style={[
                      styles.noHistory,
                      { color: theme.mutedText },
                    ]}
                  >
                    No delivery history yet.
                  </Text>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
  },

  subtitle: {
    fontSize: 14,
    marginTop: 5,
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeBanner: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  activeBannerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  activeBannerText: {
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: 13,
    marginTop: 4,
  },

  offlineCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },

  offlineTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  offlineText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },

  errorCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },

  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  errorText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },

  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  loadingContainer: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },

  sectionSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },

  sortText: {
    fontSize: 13,
    fontWeight: '700',
  },

  filterRow: {
    gap: 8,
    paddingBottom: 16,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },

  filterText: {
    fontSize: 13,
    fontWeight: '700',
  },

  list: {
    gap: 12,
  },

  jobCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },

  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  jobTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },

  typeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  jobType: {
    fontSize: 15,
    fontWeight: '800',
  },

  jobSubtext: {
    fontSize: 12,
    marginTop: 2,
  },

  feeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  fee: {
    fontSize: 17,
    fontWeight: '800',
  },

  routeContainer: {
    marginTop: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },

  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  routeDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  routeText: {
    flex: 1,
  },

  routeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  routeValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 3,
  },

  routeLine: {
    width: 1,
    height: 15,
    marginLeft: 4,
    marginVertical: 2,
  },

  jobFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  footerText: {
    fontSize: 12,
    fontWeight: '600',
  },

  viewJob: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  viewJobText: {
    fontSize: 13,
    fontWeight: '700',
  },

  emptyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
  },

  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 20,
  },

  historyToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },

  historyList: {
    gap: 10,
  },

  historyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
  },

  historyMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  historyType: {
    fontSize: 14,
    fontWeight: '800',
  },

  historyRoute: {
    fontSize: 12,
    marginTop: 4,
  },

  historyRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },

  historyAmount: {
    fontSize: 14,
    fontWeight: '800',
  },

  historyStatus: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },

  noHistory: {
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 10,
  },
});
