import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  CircleAlert,
  Clock3,
  DollarSign,
  Package,
  Power,
  RefreshCw,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-react-native';

import { useJobsStore } from '@/src/stores/jobsStore';
import { useNotificationsStore } from '@/src/stores/notificationsStore';
import { usePartnerStore } from '@/src/stores/partnerStore';
import {
  selectEarningsBalance,
  useWalletStore,
} from '@/src/stores/walletStore';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme/colors';
import { formatCurrency } from '@/src/utils/money';

function getTypeLabel(type: string) {
  switch (type) {
    case 'FOOD':
      return 'Food';

    case 'LAUNDRY':
      return 'Laundry';

    case 'MARKETPLACE':
      return 'Marketplace';

    default:
      return 'Delivery';
  }
}

function getTypeIcon(type: string) {
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

export default function PartnerHomeScreen() {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  const name = usePartnerStore(
    (state) => state.name,
  );

  const isAvailable = usePartnerStore(
    (state) => state.isAvailable,
  );

  const mode = usePartnerStore(
    (state) => state.mode,
  );

  const loadProfile = usePartnerStore(
    (state) => state.loadProfile,
  );

  const setAvailable = usePartnerStore(
    (state) => state.setAvailable,
  );

  const jobs = useJobsStore(
    (state) => state.jobs,
  );

  const jobsLoading = useJobsStore(
    (state) => state.isLoading,
  );

  const jobsError = useJobsStore(
    (state) => state.error,
  );

  const loadJobs = useJobsStore(
    (state) => state.loadJobs,
  );

  const notifications = useNotificationsStore(
    (state) => state.notifications,
  );

  const walletBalance = useWalletStore((state) =>
    selectEarningsBalance(state.ledger),
  );

  const [isInitializing, setIsInitializing] =
    useState(true);

  const [isTogglingAvailability, setIsTogglingAvailability] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [initializationError, setInitializationError] =
    useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setIsInitializing(true);
      setInitializationError(null);

      try {
        await Promise.all([
          loadProfile(),
          loadJobs(),
        ]);
      } catch (error) {
        if (!mounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load delivery data.';

        setInitializationError(message);
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    void initialize();

    return () => {
      mounted = false;
    };
  }, [loadProfile, loadJobs]);

  const activeJob = jobs.find(
    (job) =>
      ![
        'AVAILABLE',
        'COMPLETED',
        'FAILED',
      ].includes(job.stage),
  );

  const availableJobs = jobs.filter(
    (job) => job.stage === 'AVAILABLE',
  );

  const completedJobs = jobs.filter(
    (job) => job.stage === 'COMPLETED',
  );

  const recentJobs = jobs
    .filter(
      (job) =>
        job.stage === 'COMPLETED' ||
        job.stage === 'FAILED',
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )
    .slice(0, 3);

  const unreadNotifications =
    notifications.filter(
      (notification) => !notification.read,
    ).length;

  const refresh = async () => {
    setRefreshing(true);
    setInitializationError(null);

    try {
      await Promise.all([
        loadProfile(),
        loadJobs(),
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to refresh delivery data.';

      setInitializationError(message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAvailabilityChange = async (
    value: boolean,
  ) => {
    if (isTogglingAvailability) {
      return;
    }

    setIsTogglingAvailability(true);
    setInitializationError(null);

    try {
      await setAvailable(value);

      /*
       * Refresh available deliveries after going online
       * or offline so the dashboard reflects the
       * backend state.
       */
      await loadJobs();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update availability.';

      Alert.alert(
        'Unable to update status',
        message,
      );

      setInitializationError(message);
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  if (isInitializing) {
    return (
      <View
        style={[
          styles.centered,
          {
            backgroundColor: theme.background,
          },
        ]}
      >
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
          Loading your delivery dashboard...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerIdentity}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor:
                    theme.primary,
                },
              ]}
            >
              <UserRound
                size={22}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.greeting}>
              <Text
                style={[
                  styles.greetingSmall,
                  { color: theme.mutedText },
                ]}
              >
                Welcome back
              </Text>

              <Text
                numberOfLines={1}
                style={[
                  styles.name,
                  { color: theme.text },
                ]}
              >
                {name || 'Delivery Partner'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => void refresh()}
              style={[
                styles.headerButton,
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

            <Pressable
              onPress={() =>
                router.push(
                  '/(partner)/notifications',
                )
              }
              style={[
                styles.headerButton,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <Bell
                size={18}
                color={theme.text}
              />

              {unreadNotifications > 0 && (
                <View
                  style={[
                    styles.notificationDot,
                    {
                      backgroundColor:
                        theme.primary,
                    },
                  ]}
                />
              )}
            </Pressable>
          </View>
        </View>

        {initializationError && (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.danger,
              },
            ]}
          >
            <CircleAlert
              size={19}
              color={theme.danger}
            />

            <View style={styles.errorInfo}>
              <Text
                style={[
                  styles.errorTitle,
                  { color: theme.danger },
                ]}
              >
                Something needs attention
              </Text>

              <Text
                style={[
                  styles.errorText,
                  { color: theme.mutedText },
                ]}
              >
                {initializationError}
              </Text>
            </View>
          </View>
        )}

        <View
          style={[
            styles.yourStyle,
            {
              backgroundColor: '#FFFFFF',
              borderColor: '#FFFFFF',
            },
          ]}
                  >
          <View style={styles.statusLeft}>
            <View
              style={[
                styles.powerIcon,
                {
                  backgroundColor: isAvailable
                    ? 'rgba(255,255,255,0.16)'
                    : theme.background,
                },
              ]}
            >
              <Power
                size={21}
                color={
                  isAvailable
                    ? '#FFFFFF'
                    : theme.text
                }
              />
            </View>

            <View style={styles.statusText}>
              <Text
                style={[
                  styles.statusTitle,
                  {
                    color: isAvailable
                      ? '#FFFFFF'
                      : theme.text,
                  },
                ]}
              >
                {isAvailable
                  ? 'You are online'
                  : 'You are offline'}
              </Text>

              <Text
                style={[
                  styles.statusSubtitle,
                  {
                    color: isAvailable
                      ? 'rgba(255,255,255,0.82)'
                      : theme.mutedText,
                  },
                ]}
              >
                {isAvailable
                  ? 'You can receive delivery jobs'
                  : 'Go online to receive jobs'}
              </Text>
            </View>
          </View>

          <Pressable
            disabled={isTogglingAvailability}
            onPress={() =>
              void handleAvailabilityChange(
                !isAvailable,
              )
            }
            style={[
              styles.toggle,
              {
                backgroundColor: isAvailable
                  ? 'rgba(255,255,255,0.22)'
                  : theme.background,
              },
            ]}
          >
            {isTogglingAvailability ? (
              <ActivityIndicator
                size="small"
                color={
                  isAvailable
                    ? '#FFFFFF'
                    : theme.text
                }
              />
            ) : (
              <View
                style={[
                  styles.toggleThumb,
                  {
                    backgroundColor:
                      isAvailable
                        ? '#FFFFFF'
                        : theme.mutedText,
                    alignSelf: isAvailable
                      ? 'flex-end'
                      : 'flex-start',
                  },
                ]}
              />
            )}
          </Pressable>
        </View>

        <View
          style={[
            styles.modeCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.modeLeft}>
            <Package
              size={19}
              color={theme.mutedText}
            />

            <View style={styles.modeInfo}>
              <Text
                style={[
                  styles.modeLabel,
                  { color: theme.mutedText },
                ]}
              >
                DELIVERY MODE
              </Text>

              <Text
                style={[
                  styles.modeValue,
                  { color: theme.text },
                ]}
              >
                {mode === 'MOTORCYCLE'
                  ? 'Motorcycle'
                  : 'Walking'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() =>
              router.push(
                '/(partner)/profile',
              )
            }
            style={styles.changeModeButton}
          >
            <Text
              style={[
                styles.changeModeText,
                { color: theme.primary },
              ]}
            >
              View profile
            </Text>

            <ChevronRight
              size={17}
              color={theme.primary}
            />
          </Pressable>
        </View>

        {activeJob && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.text },
                  ]}
                >
                  Active delivery
                </Text>

                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: theme.mutedText },
                  ]}
                >
                  Complete your current delivery
                  before accepting another one.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() =>
                router.push(
                  `/(partner)/active/${activeJob.id}`,
                )
              }
              style={({ pressed }) => [
                styles.activeJobCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <View style={styles.activeJobHeader}>
                <View
                  style={[
                    styles.activeJobIcon,
                    {
                      backgroundColor:
                        theme.background,
                    },
                  ]}
                >
                  {(() => {
                    const Icon = getTypeIcon(
                      activeJob.type,
                    );

                    return (
                      <Icon
                        size={21}
                        color={theme.primary}
                      />
                    );
                  })()}
                </View>

                <View
                  style={styles.activeJobInfo}
                >
                  <Text
                    style={[
                      styles.activeJobType,
                      { color: theme.text },
                    ]}
                  >
                    {getTypeLabel(
                      activeJob.type,
                    )}
                  </Text>

                  <Text
                    style={[
                      styles.activeJobStage,
                      {
                        color:
                          theme.primary,
                      },
                    ]}
                  >
                    {activeJob.stage.replace(
                      /_/g,
                      ' ',
                    )}
                  </Text>
                </View>

                <ChevronRight
                  size={20}
                  color={theme.mutedText}
                />
              </View>

              <View
                style={[
                  styles.activeRoute,
                  {
                    borderTopColor:
                      theme.border,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.activeRouteText,
                    { color: theme.text },
                  ]}
                >
                  {activeJob.pickup.label}
                </Text>

                <Text
                  style={[
                    styles.routeArrow,
                    { color: theme.mutedText },
                  ]}
                >
                  →
                </Text>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.activeRouteText,
                    { color: theme.text },
                  ]}
                >
                  {activeJob.dropoff.label}
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.text },
                ]}
              >
                Delivery activity
              </Text>

              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: theme.mutedText },
                ]}
              >
                Current delivery availability
              </Text>
            </View>

            <Pressable
              onPress={() =>
                router.push(
                  '/(partner)/jobs',
                )
              }
            >
              <Text
                style={[
                  styles.viewAllText,
                  { color: theme.primary },
                ]}
              >
                View jobs
              </Text>
            </Pressable>
          </View>

          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.statIcon,
                  {
                    backgroundColor:
                      theme.background,
                  },
                ]}
              >
                <Package
                  size={19}
                  color={theme.primary}
                />
              </View>

              <Text
                style={[
                  styles.statValue,
                  { color: theme.text },
                ]}
              >
                {jobsLoading
                  ? '—'
                  : availableJobs.length}
              </Text>

              <Text
                style={[
                  styles.statLabel,
                  { color: theme.mutedText },
                ]}
              >
                Available
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.statIcon,
                  {
                    backgroundColor:
                      theme.background,
                  },
                ]}
              >
                <CheckCircleIcon
                  color={theme.primary}
                />
              </View>

              <Text
                style={[
                  styles.statValue,
                  { color: theme.text },
                ]}
              >
                {completedJobs.length}
              </Text>

              <Text
                style={[
                  styles.statLabel,
                  { color: theme.mutedText },
                ]}
              >
                Completed
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.text },
                ]}
              >
                Wallet
              </Text>

              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: theme.mutedText },
                ]}
              >
                Current local wallet balance
              </Text>
            </View>

            <Pressable
              onPress={() =>
                router.push(
                  '/(partner)/wallet',
                )
              }
            >
              <Text
                style={[
                  styles.viewAllText,
                  { color: theme.primary },
                ]}
              >
                Open wallet
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.walletCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.walletIcon,
                {
                  backgroundColor:
                    theme.background,
                },
              ]}
            >
              <DollarSign
                size={21}
                color={theme.primary}
              />
            </View>

            <View style={styles.walletInfo}>
              <Text
                style={[
                  styles.walletLabel,
                  { color: theme.mutedText },
                ]}
              >
                BALANCE
              </Text>

              <Text
                style={[
                  styles.walletAmount,
                  { color: theme.text },
                ]}
              >
                {formatCurrency(
                  walletBalance,
                )}
              </Text>
            </View>

            <ChevronRight
              size={19}
              color={theme.mutedText}
            />
          </View>

          <Text
            style={[
              styles.walletNotice,
              { color: theme.mutedText },
            ]}
          >
            Wallet data is still stored locally
            in this MVP. Backend earnings are
            recorded separately.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.text },
                ]}
              >
                Recent deliveries
              </Text>
            </View>

            <Pressable
              onPress={() =>
                router.push(
                  '/(partner)/jobs',
                )
              }
            >
              <Text
                style={[
                  styles.viewAllText,
                  { color: theme.primary },
                ]}
              >
                View all
              </Text>
            </Pressable>
          </View>

          {recentJobs.length > 0 ? (
            <View style={styles.recentList}>
              {recentJobs.map((job) => (
                <Pressable
                  key={job.id}
                  onPress={() =>
                    router.push(
                      `/(partner)/jobs/${job.id}`,
                    )
                  }
                  style={[
                    styles.recentCard,
                    {
                      backgroundColor:
                        theme.card,
                      borderColor:
                        theme.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.recentIcon,
                      {
                        backgroundColor:
                          theme.background,
                      },
                    ]}
                  >
                    {(() => {
                      const Icon =
                        getTypeIcon(
                          job.type,
                        );

                      return (
                        <Icon
                          size={18}
                          color={
                            theme.primary
                          }
                        />
                      );
                    })()}
                  </View>

                  <View
                    style={styles.recentInfo}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.recentTitle,
                        {
                          color:
                            theme.text,
                        },
                      ]}
                    >
                      {job.pickup.label}
                    </Text>

                    <Text
                      numberOfLines={1}
                      style={[
                        styles.recentRoute,
                        {
                          color:
                            theme.mutedText,
                        },
                      ]}
                    >
                      → {job.dropoff.label}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.recentRight
                    }
                  >
                    <Text
                      style={[
                        styles.recentAmount,
                        {
                          color:
                            theme.text,
                        },
                      ]}
                    >
                      {formatCurrency(
                        job.deliveryFee,
                      )}
                    </Text>

                    <Text
                      style={[
                        styles.recentStatus,
                        {
                          color:
                            job.stage ===
                            'FAILED'
                              ? theme.danger
                              : theme.primary,
                        },
                      ]}
                    >
                      {job.stage ===
                      'FAILED'
                        ? 'Failed'
                        : 'Completed'}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor:
                    theme.card,
                  borderColor:
                    theme.border,
                },
              ]}
            >
              <Clock3
                size={28}
                color={theme.mutedText}
              />

              <Text
                style={[
                  styles.emptyTitle,
                  { color: theme.text },
                ]}
              >
                No recent deliveries
              </Text>

              <Text
                style={[
                  styles.emptyText,
                  { color: theme.mutedText },
                ]}
              >
                Completed deliveries will appear
                here.
              </Text>
            </View>
          )}
        </View>

        <View
          style={[
            styles.safetyCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <ShieldCheck
            size={22}
            color={theme.primary}
          />

          <View style={styles.safetyInfo}>
            <Text
              style={[
                styles.safetyTitle,
                { color: theme.text },
              ]}
            >
              Delivery safety
            </Text>

            <Text
              style={[
                styles.safetyText,
                { color: theme.mutedText },
              ]}
            >
              If you encounter a problem during a
              delivery, use the safety and support
              options from the active delivery.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function CheckCircleIcon({
  color,
}: {
  color: string;
}) {
  return (
    <View
      style={{
        width: 19,
        height: 19,
        borderWidth: 2,
        borderColor: color,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 120,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  headerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },

  greeting: {
    flex: 1,
    marginLeft: 11,
  },

  greetingSmall: {
    fontSize: 12,
  },

  name: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: 2,
  },

  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  errorCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  errorInfo: {
    flex: 1,
    marginLeft: 10,
  },

  errorTitle: {
    fontSize: 13,
    fontWeight: '800',
  },

  errorText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  statusCard: {
    borderRadius: 18,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  powerIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusText: {
    flex: 1,
    marginLeft: 11,
  },

  statusTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  statusSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },

  toggle: {
    width: 50,
    height: 29,
    borderRadius: 15,
    padding: 4,
    justifyContent: 'center',
  },

  toggleThumb: {
    width: 21,
    height: 21,
    borderRadius: 11,
  },

  modeCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  modeInfo: {
    marginLeft: 10,
  },

  modeLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  modeValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
  },

  changeModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },

  changeModeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  section: {
    marginTop: 24,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
  },

  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
    maxWidth: 270,
  },

  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
  },

  activeJobCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },

  activeJobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  activeJobIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeJobInfo: {
    flex: 1,
    marginLeft: 11,
  },

  activeJobType: {
    fontSize: 15,
    fontWeight: '800',
  },

  activeJobStage: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },

  activeRoute: {
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  activeRouteText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },

  routeArrow: {
    marginHorizontal: 7,
    fontSize: 14,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },

  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 17,
    padding: 15,
  },

  statIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 11,
  },

  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },

  walletCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },

  walletIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  walletInfo: {
    flex: 1,
    marginLeft: 11,
  },

  walletLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  walletAmount: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 3,
  },

  walletNotice: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },

  recentList: {
    gap: 9,
  },

  recentCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  recentIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  recentInfo: {
    flex: 1,
    marginLeft: 10,
  },

  recentTitle: {
    fontSize: 13,
    fontWeight: '700',
  },

  recentRoute: {
    fontSize: 11,
    marginTop: 3,
  },

  recentRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },

  recentAmount: {
    fontSize: 13,
    fontWeight: '800',
  },

  recentStatus: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },

  emptyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
  },

  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 5,
  },

  safetyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  safetyInfo: {
    flex: 1,
    marginLeft: 11,
  },

  safetyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },

  safetyText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
});
