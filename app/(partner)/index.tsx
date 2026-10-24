import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  CircleAlert,
  Flame,
  MapPin,
  PackageSearch,
  Zap,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { Badge } from '@/src/shared/components/Badge';
import { Button } from '@/src/shared/components/Button';
import { DemandMap } from '@/src/shared/components/DemandMap';
import { GlassView } from '@/src/shared/components/GlassView';
import { NAV_BAR_CLEARANCE } from '@/src/shared/components/FloatingNav';
import { ProgressBar } from '@/src/shared/components/ProgressBar';
import { SlideToggle } from '@/src/shared/components/SlideToggle';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { demandSnapshot } from '@/src/data/mockDemand';
import { useInteractionStore } from '@/src/stores/interactionStore';
import { useJobsStore } from '@/src/stores/jobsStore';
import { selectUnreadCount, useNotificationsStore } from '@/src/stores/notificationsStore';
import { usePartnerStore } from '@/src/stores/partnerStore';
import { selectEarningsBalance, selectReimbursedTotal, useWalletStore } from '@/src/stores/walletStore';
import { colors } from '@/src/theme';
import { isOfferedOpenJob } from '@/src/utils/jobFilters';
import { formatCurrency } from '@/src/utils/money';

// Layout/visual language ported from the app's established GlassView design
// system (matching the customer app's dashboard patterns) — data loading,
// refresh, and error handling below are unchanged from the backend-connected
// version: real `loadProfile()`/`loadJobs()` calls, retry-on-error, and an
// availability toggle that rolls back on a failed backend PATCH.
export default function PartnerHomeScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  const offlineByTap = useInteractionStore((s) => s.offlineByTap);

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

  const availableCount = jobs.filter(isOfferedOpenJob).length;
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background, gap: 12 }}>
        <ActivityIndicator size="large" color={colors.partner.orange} />
        <Text className="text-body" style={{ color: theme.textSecondary }}>
          Loading your delivery dashboard...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      // paddingBottom uses NAV_BAR_CLEARANCE (+ insets.bottom) since this
      // screen sits under a floating, absolutely-positioned nav instead of a
      // native tab bar that used to reserve its own space automatically.
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: insets.bottom + NAV_BAR_CLEARANCE, gap: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          tintColor={colors.partner.orange}
          colors={[colors.partner.orange]}
        />
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text className="text-caption" style={{ color: theme.textSecondary }}>Welcome back</Text>
          <Text className="text-h1 font-bold" style={{ color: theme.text }}>{name || 'Delivery Partner'}</Text>
        </View>
        <AnimatedPressable onPress={() => router.push('/(partner)/notifications')} scaleTo={0.9}>
          <View>
            <Bell size={24} color={theme.text} />
            {unreadCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  paddingHorizontal: 3,
                  backgroundColor: colors.partner.orange,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </AnimatedPressable>
      </View>

      {/* Most-important content, top-left: availability + today's earnings
          merged into one card rather than two scattered mini-widgets, per
          the redesign brief's dashboard rules. */}
      <GlassView radius="card" intensity="strong" style={{ padding: 20, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text
            className="text-caption font-semibold"
            style={{ color: isAvailable ? colors.partner.orange : theme.textSecondary }}
          >
            {isTogglingAvailability ? 'Updating…' : isAvailable ? "You're online" : "You're offline"}
          </Text>
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8 }}>
              TODAY
            </Text>
            <Text className="text-h1 font-bold" style={{ color: theme.text }}>{formatCurrency(todayEarnings)}</Text>
          </View>
        </View>
        {/* Slide instead of tap, so availability can't change by accident. */}
        <SlideToggle
          isOnline={isAvailable}
          onChange={(v) => void handleAvailabilityChange(v)}
          busy={isTogglingAvailability}
          offlineByTap={offlineByTap}
        />
      </GlassView>

      {initializationError && (
        <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <CircleAlert size={19} color={colors.semantic.error} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text className="text-body-lg font-semibold" style={{ color: colors.semantic.error }}>
              Something needs attention
            </Text>
            <Text className="text-caption" style={{ color: theme.textSecondary }}>{initializationError}</Text>
            <AnimatedPressable onPress={() => void refresh()} scaleTo={0.97} style={{ alignSelf: 'flex-start', marginTop: 6 }}>
              <Text className="text-caption font-semibold" style={{ color: colors.partner.orange }}>Try again</Text>
            </AnimatedPressable>
          </View>
        </GlassView>
      )}

      {jobsError && !initializationError && (
        <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <CircleAlert size={19} color={colors.semantic.error} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text className="text-body-lg font-semibold" style={{ color: colors.semantic.error }}>
              Couldn't load jobs
            </Text>
            <Text className="text-caption" style={{ color: theme.textSecondary }}>{jobsError}</Text>
            <AnimatedPressable onPress={() => void loadJobs()} scaleTo={0.97} style={{ alignSelf: 'flex-start', marginTop: 6 }}>
              <Text className="text-caption font-semibold" style={{ color: colors.partner.orange }}>Try again</Text>
            </AnimatedPressable>
          </View>
        </GlassView>
      )}

      {!activeJob && (
        <AnimatedPressable onPress={() => router.push('/(partner)/demand')} scaleTo={0.98}>
          <GlassView radius="card" style={{ padding: 20, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Flame size={18} color={colors.semantic.error} />
              <Text className="text-body-lg font-semibold" style={{ color: theme.text }}>{demandSnapshot.headline}</Text>
            </View>
            <Text className="text-caption" style={{ color: theme.textSecondary }}>
              {demandSnapshot.totalNearbyOrders} orders within {demandSnapshot.radiusKm} km · est.{' '}
              {formatCurrency(demandSnapshot.estimatedHourlyMin)} – {formatCurrency(demandSnapshot.estimatedHourlyMax)}/hr
            </Text>
            {/* <DemandMap zones={demandSnapshot.zones} height={110} /> */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
              <Text className="text-caption font-semibold" style={{ color: colors.partner.orange }}>View demand map</Text>
              <ChevronRight size={14} color={colors.partner.orange} />
            </View>
          </GlassView>
        </AnimatedPressable>
      )}

      {!isAvailable && !activeJob && (
        <GlassView radius="card" style={{ padding: 20, alignItems: 'flex-start', gap: 10 }}>
          <Zap size={22} color={colors.partner.orange} />
          <Text className="text-card-title font-semibold" style={{ color: theme.text }}>You're offline</Text>
          <Text className="text-body" style={{ color: theme.textSecondary }}>
            Slide to go online and start receiving food delivery jobs near you.
          </Text>
        </GlassView>
      )}

      {activeJob && (
        <AnimatedPressable onPress={() => router.push(`/(partner)/active/${activeJob.id}`)} scaleTo={0.98}>
          <GlassView radius="card" intensity="strong" style={{ padding: 20, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge jobType={activeJob.type} label={activeJob.type} />
              <ChevronRight size={20} color={theme.textSecondary} />
            </View>
            <Text className="text-card-title font-semibold" style={{ color: theme.text }}>
              Active delivery in progress
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MapPin size={16} color={theme.textSecondary} />
              <Text className="text-body" style={{ color: theme.textSecondary }} numberOfLines={1}>
                {activeJob.dropoff.label}
              </Text>
            </View>
            <Button title="Continue delivery" variant="partner" onPress={() => router.push(`/(partner)/active/${activeJob.id}`)} />
          </GlassView>
        </AnimatedPressable>
      )}

      {isAvailable && !activeJob && !jobsLoading && availableCount > 0 && (
        <AnimatedPressable onPress={() => router.push('/(partner)/jobs')} scaleTo={0.98}>
          <GlassView radius="card" style={{ padding: 20, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text className="text-card-title font-semibold" style={{ color: theme.text }}>
                {availableCount} job{availableCount === 1 ? '' : 's'} available
              </Text>
              <ChevronRight size={20} color={theme.textSecondary} />
            </View>
            <Text className="text-body" style={{ color: theme.textSecondary }}>
              Browse and accept a food delivery job.
            </Text>
          </GlassView>
        </AnimatedPressable>
      )}

      {isAvailable && !activeJob && jobsLoading && (
        <GlassView radius="card" style={{ padding: 20, alignItems: 'center', gap: 8 }}>
          <ActivityIndicator color={colors.partner.orange} />
          <Text className="text-caption" style={{ color: theme.textSecondary }}>Checking for nearby jobs…</Text>
        </GlassView>
      )}

      {isAvailable && !activeJob && !jobsLoading && availableCount === 0 && !jobsError && (
        <GlassView radius="card" style={{ padding: 20, alignItems: 'flex-start', gap: 8 }}>
          <PackageSearch size={22} color={theme.textSecondary} />
          <Text className="text-card-title font-semibold" style={{ color: theme.text }}>No jobs nearby right now</Text>
          <Text className="text-body" style={{ color: theme.textSecondary }}>
            You're online and ready — a new food delivery job will show up here as soon as one opens up.
          </Text>
        </GlassView>
      )}

      <AnimatedPressable onPress={() => router.push('/(partner)/wallet')} scaleTo={0.98}>
        <GlassView radius="card" style={{ padding: 20, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8 }}>
              WALLET
            </Text>
            <ChevronRight size={18} color={theme.textSecondary} />
          </View>
          <Text className="text-display font-bold" style={{ color: theme.text }}>{formatCurrency(earnings)}</Text>
          <Text className="text-caption" style={{ color: theme.textSecondary }}>
            toward your {formatCurrency(threshold)} cash-out
          </Text>
          <ProgressBar progress={earnings / threshold} color={colors.partner.orange} />
          <Text className="text-caption" style={{ color: theme.textSecondary }}>
            + {formatCurrency(reimbursed)} already reimbursed to you
          </Text>
        </GlassView>
      </AnimatedPressable>
    </ScrollView>
  );
}
