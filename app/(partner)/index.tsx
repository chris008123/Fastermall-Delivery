import { router } from 'expo-router';
import { Bell, ChevronRight, Flame, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import { demandSnapshot } from '@/src/data/mockDemand';
import { useJobsStore } from '@/src/stores/jobsStore';
import { selectUnreadCount, useNotificationsStore } from '@/src/stores/notificationsStore';
import { usePartnerStore } from '@/src/stores/partnerStore';
import { selectEarningsBalance, selectReimbursedTotal, useWalletStore } from '@/src/stores/walletStore';
import { formatCurrency } from '@/src/utils/money';
import { useNavClearance } from '@/src/ui/AppNav';
import { Button } from '@/src/ui/Button';
import { JobTag } from '@/src/ui/Tag';
import { Notice } from '@/src/ui/Notice';
import { Panel } from '@/src/ui/Panel';
import { ProgressBar } from '@/src/ui/ProgressBar';
import { SlideToggle } from '@/src/ui/SlideToggle';

// Home. The one bold element is the slide-to-go-online control under
// today's earnings; everything else stays flat and quiet. Data loading,
// refresh, error handling and the availability rollback on a failed
// backend PATCH are unchanged from the backend-connected version.
export default function PartnerHomeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTheme();
  const navClearance = useNavClearance();

  const name = usePartnerStore((s) => s.name);
  const isAvailable = usePartnerStore((s) => s.isAvailable);
  const loadProfile = usePartnerStore((s) => s.loadProfile);
  const setAvailable = usePartnerStore((s) => s.setAvailable);

  const jobs = useJobsStore((s) => s.jobs);
  const jobsLoading = useJobsStore((s) => s.isLoading);
  const jobsError = useJobsStore((s) => s.error);
  const loadJobs = useJobsStore((s) => s.loadJobs);

  const ledger = useWalletStore((s) => s.ledger);
  const threshold = useWalletStore((s) => s.withdrawalThreshold);
  const loadWallet = useWalletStore((s) => s.loadWallet);
  const unreadCount = useNotificationsStore((s) => selectUnreadCount(s.notifications));

  const [isInitializing, setIsInitializing] = useState(true);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setIsInitializing(true);
      setInitializationError(null);

      try {
        await Promise.all([
          loadProfile(),
          loadJobs(),
          loadWallet(),
        ]);
      } catch (error) {
        if (!mounted) return;
        setInitializationError(error instanceof Error ? error.message : 'Unable to load delivery data.');
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };

    void initialize();

    return () => {
      mounted = false;
    };
  }, [loadProfile, loadJobs, loadWallet]);

  const refresh = async () => {
    setRefreshing(true);
    setInitializationError(null);

    try {
      await Promise.all([
        loadProfile(),
        loadJobs(),
        loadWallet(),
      ]);
    } catch (error) {
      setInitializationError(error instanceof Error ? error.message : 'Unable to refresh delivery data.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAvailabilityChange = async (value: boolean) => {
    if (isTogglingAvailability) return;

    setIsTogglingAvailability(true);

    try {
      await setAvailable(value);
      // Refresh available deliveries after going online/offline so the
      // dashboard reflects the backend state.
      await loadJobs();
    } catch (error) {
      Alert.alert(
        'Unable to update status',
        error instanceof Error ? error.message : 'Unable to update availability.',
      );
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const availableCount = jobs.filter((j) => j.stage === 'AVAILABLE').length;
  const activeJob = jobs.find((j) => j.stage !== 'AVAILABLE' && j.stage !== 'COMPLETED' && j.stage !== 'FAILED');
  const earnings = selectEarningsBalance(ledger);
  const reimbursed = selectReimbursedTotal(ledger);
  // Derived, presentation-only — not a new store selector: today's cut of
  // the same ledger the wallet card already reads, for the top status card.
  const todayKey = new Date().toDateString();
  const todayEarnings = ledger
    .filter((e) => e.type === 'EARNING' && new Date(e.createdAt).toDateString() === todayKey)
    .reduce((sum, e) => sum + e.amount, 0);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg, gap: 12 }}>
        <ActivityIndicator size="large" color={t.primary} />
        <Txt variant="body" tone="secondary">
          Loading your dashboard…
        </Txt>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: navClearance, gap: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          tintColor={t.primary}
          colors={[t.primary]}
        />
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Txt variant="caption" tone="secondary">
            Welcome back
          </Txt>
          <Txt variant="display" numberOfLines={1}>
            {name || 'Delivery Partner'}
          </Txt>
        </View>
        <Pressable
          onPress={() => router.push('/(partner)/notifications')}
          accessibilityRole="button"
          accessibilityLabel={unreadCount > 0 ? `Alerts, ${unreadCount} unread` : 'Alerts'}
          hitSlop={4}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <View>
            <Bell size={24} color={t.ink} />
            {unreadCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -5,
                  right: -7,
                  minWidth: 16,
                  height: 16,
                  paddingHorizontal: 4,
                  borderRadius: 8,
                  backgroundColor: t.alert,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Txt variant="micro" color={t.onAlert} style={{ fontSize: 10, lineHeight: 12 }}>
                  {unreadCount > 9 ? '9+' : String(unreadCount)}
                </Txt>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      <View style={{ gap: 16, marginTop: 8 }}>
        <View>
          <Txt variant="caption" tone="secondary">
            Earned today
          </Txt>
          <Txt variant="numeral" numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(todayEarnings)}
          </Txt>
        </View>
        <SlideToggle
          isOnline={isAvailable}
          onChange={(v) => void handleAvailabilityChange(v)}
          busy={isTogglingAvailability}
        />
      </View>

      {initializationError && (
        <Notice
          title="Something needs attention"
          message={initializationError}
          actionLabel="Try again"
          onAction={() => void refresh()}
        />
      )}

      {jobsError && !initializationError && (
        <Notice
          title="Couldn't load jobs"
          message={jobsError}
          actionLabel="Try again"
          onAction={() => void loadJobs()}
        />
      )}

      {activeJob && (
        <Panel onPress={() => router.push(`/(partner)/active/${activeJob.id}`)} accessibilityLabel="Continue active delivery" style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <JobTag jobType={activeJob.type} />
            <ChevronRight size={20} color={t.inkTertiary} />
          </View>
          <Txt variant="title">Delivery in progress</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MapPin size={16} color={t.inkSecondary} />
            <Txt variant="body" tone="secondary" numberOfLines={1} style={{ flex: 1 }}>
              {activeJob.dropoff.label}
            </Txt>
          </View>
          <Button
            title="Continue delivery"
            variant="job"
            jobType={activeJob.type}
            fullWidth
            onPress={() => router.push(`/(partner)/active/${activeJob.id}`)}
          />
        </Panel>
      )}

      {!activeJob && !isAvailable && (
        <Panel style={{ gap: 4 }}>
          <Txt variant="heading">You're offline</Txt>
          <Txt variant="body" tone="secondary">
            Slide to go online and start receiving Marketplace, Food and Laundry jobs near you.
          </Txt>
        </Panel>
      )}

      {!activeJob && isAvailable && jobsLoading && (
        <Panel style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator color={t.primary} />
          <Txt variant="body" tone="secondary">
            Checking for nearby jobs…
          </Txt>
        </Panel>
      )}

      {!activeJob && isAvailable && !jobsLoading && availableCount > 0 && (
        <Panel
          onPress={() => router.push('/(partner)/jobs')}
          accessibilityLabel={`${availableCount} jobs available. Browse jobs`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
        >
          <Txt variant="display" tone="primary" style={{ fontVariant: ['tabular-nums'] }}>
            {availableCount}
          </Txt>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">job{availableCount === 1 ? '' : 's'} available</Txt>
            <Txt variant="caption" tone="secondary">
              Browse and accept one
            </Txt>
          </View>
          <ChevronRight size={20} color={t.inkTertiary} />
        </Panel>
      )}

      {!activeJob && isAvailable && !jobsLoading && availableCount === 0 && !jobsError && (
        <Panel style={{ gap: 4 }}>
          <Txt variant="heading">No jobs nearby right now</Txt>
          <Txt variant="body" tone="secondary">
            You're online. New jobs will show up here as soon as one opens up.
          </Txt>
        </Panel>
      )}

      {!activeJob && (
        <Panel onPress={() => router.push('/(partner)/demand')} accessibilityLabel="Demand near you" style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Flame size={18} color={t.alertInk} />
            <Txt variant="heading" style={{ flex: 1 }}>
              {demandSnapshot.headline}
            </Txt>
            <ChevronRight size={20} color={t.inkTertiary} />
          </View>
          <Txt variant="caption" tone="secondary">
            {demandSnapshot.totalNearbyOrders} orders within {demandSnapshot.radiusKm} km
          </Txt>
          <Txt variant="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>
            {formatCurrency(demandSnapshot.estimatedHourlyMin)} – {formatCurrency(demandSnapshot.estimatedHourlyMax)} an hour
          </Txt>
          {/* The demand map preview stays disabled, as before. */}
        </Panel>
      )}

      <Panel onPress={() => router.push('/(partner)/wallet')} accessibilityLabel="Wallet" style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt variant="heading">Wallet</Txt>
          <ChevronRight size={20} color={t.inkTertiary} />
        </View>
        <Txt variant="display" style={{ fontVariant: ['tabular-nums'] }}>
          {formatCurrency(earnings)}
        </Txt>
        <ProgressBar progress={threshold > 0 ? earnings / threshold : 0} />
        <Txt variant="caption" tone="secondary">
          toward your {formatCurrency(threshold)} cash-out · {formatCurrency(reimbursed)} reimbursed so far
        </Txt>
      </Panel>
    </ScrollView>
  );
}
