import { router, useLocalSearchParams } from 'expo-router';
import { Bike, Footprints, MapPin, Package, PackageX, Wallet } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/src/shared/components/BackButton';
import { Badge } from '@/src/shared/components/Badge';
import { Button } from '@/src/shared/components/Button';
import { DeliveryMap } from '@/src/shared/components/DeliveryMap';
import { GlassView } from '@/src/shared/components/GlassView';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { haptics } from '@/src/shared/utils/haptics';
import { useJobsStore } from '@/src/stores/jobsStore';
import { colors } from '@/src/theme';
import type { JobType } from '@/src/types/job';
import { formatCurrency } from '@/src/utils/money';

// Layout ported from the app's GlassView design system, same merge pattern
// as Home/Jobs-list: `acceptJob()` below is the real backend-connected
// mutation — awaited, with a loading state on the button and an error
// surfaced both inline and via Alert (a blocking action worth a blocking
// acknowledgment, unlike ordinary toast-level feedback).

const ACCEPT_VARIANT: Record<JobType, 'primary' | 'gold' | 'laundry'> = {
  MARKETPLACE: 'primary',
  FOOD: 'gold',
  LAUNDRY: 'laundry',
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  const job = useJobsStore((s) => s.jobs.find((j) => j.id === id));
  const acceptJob = useJobsStore((s) => s.acceptJob);
  const loadJobs = useJobsStore((s) => s.loadJobs);
  const isLoading = useJobsStore((s) => s.isLoading);
  const hasActiveJob = useJobsStore((s) =>
    s.jobs.some((j) => j.stage !== 'AVAILABLE' && j.stage !== 'COMPLETED' && j.stage !== 'FAILED'),
  );

  const [isAccepting, setIsAccepting] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);

  // The job may not be in the store yet if this screen was opened directly
  // (deep link, or the list hadn't loaded) rather than navigated to from
  // the jobs list.
  useEffect(() => {
    if (!job && id) {
      void loadJobs();
    }
  }, [job, id, loadJobs]);

  if (!job) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
        {isLoading ? (
          <>
            <ActivityIndicator size="large" color={colors.partner.orange} />
            <Text className="text-body" style={{ color: theme.textSecondary }}>Loading delivery...</Text>
          </>
        ) : (
          <>
            <PackageX size={32} color={theme.textSecondary} />
            <Text className="text-body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
              This job isn't available anymore.
            </Text>
            <Button title="Back to jobs" variant="ghost" onPress={() => router.replace('/(partner)/jobs')} />
          </>
        )}
      </View>
    );
  }

  const ModeIcon = job.partnerMode === 'MOTORCYCLE' ? Bike : Footprints;
  const isStillAvailable = job.stage === 'AVAILABLE';
  const isAlreadyAssigned = !isStillAvailable && job.stage !== 'COMPLETED' && job.stage !== 'FAILED';
  const canAccept = isStillAvailable && !hasActiveJob;

  const handleAccept = async () => {
    if (!canAccept || isAccepting) return;

    setScreenError(null);
    setIsAccepting(true);

    try {
      await acceptJob(job.id);
      haptics.success();
      router.replace(`/(partner)/active/${job.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to accept this delivery.';
      setScreenError(message);
      Alert.alert('Unable to accept delivery', message);
    } finally {
      setIsAccepting(false);
    }
  };

  const acceptLabel = isAlreadyAssigned
    ? 'Already assigned to another partner'
    : hasActiveJob
      ? 'Finish your active job first'
      : 'Accept job';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 32, gap: 16 }}
    >
      {/* Nav is hidden on this screen (task-focused detail view), so 32px
          is enough here — no floating nav to clear, unlike the section
          root tabs which use 100. */}
      <BackButton />
      <Badge jobType={job.type} label={job.type} />
      <Text className="text-display font-bold" style={{ color: theme.text }}>{formatCurrency(job.deliveryFee)}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <ModeIcon size={16} color={theme.textSecondary} />
        <Text className="text-body" style={{ color: theme.textSecondary }}>
          {`${job.distanceKm.toFixed(1)} km \u00b7 ~${job.etaMinutes} min \u00b7 ${job.partnerMode === 'MOTORCYCLE' ? 'Motorcycle' : 'Walking'}`}
        </Text>
      </View>

      <GlassView radius="card" style={{ padding: 18, gap: 14 }}>
        <Row icon={<MapPin size={16} color={colors.jobType[job.type].dark} />} label="Pickup" title={job.pickup.label} sub={job.pickup.sub} theme={theme} />
        <View style={{ height: 1, backgroundColor: theme.border }} />
        <Row icon={<MapPin size={16} color={theme.textSecondary} />} label="Drop-off" title={job.dropoff.label} sub={`${job.dropoff.sub} \u00b7 ${job.customerName}`} theme={theme} />
      </GlassView>
      {/* <DeliveryMap job={job} showPartner={false} height={160} /> */}
      

      <GlassView radius="card" style={{ padding: 18, gap: 6 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8 }}>ITEMS</Text>
        <Text className="text-body" style={{ color: theme.text }}>{job.itemsSummary}</Text>
      </GlassView>

      {job.vendorPayoutAmount != null && (
        <GlassView radius="card" style={{ padding: 18, gap: 8, borderWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Wallet size={16} color={colors.brand.goldDark} />
            <Text className="text-card-title font-semibold" style={{ color: theme.text }}>
              Pay {formatCurrency(job.vendorPayoutAmount)} at the vendor
            </Text>
          </View>
          <Text className="text-caption" style={{ color: theme.textSecondary }}>
            You'll front this from your own funds when you collect the order — it's reimbursed to
            your wallet the moment the customer confirms delivery, on top of your{' '}
            {formatCurrency(job.deliveryFee)} delivery earning.
          </Text>
        </GlassView>
      )}

      {screenError && (
        <Text className="text-caption" style={{ color: colors.semantic.error }}>{screenError}</Text>
      )}

      <Button
        title={isAccepting ? 'Accepting…' : acceptLabel}
        variant={ACCEPT_VARIANT[job.type]}
        loading={isAccepting}
        disabled={!canAccept}
        fullWidth
        onPress={() => void handleAccept()}
      />
    </ScrollView>
  );
}

function Row({
  icon,
  label,
  title,
  sub,
  theme,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  sub: string;
  theme: { text: string; textSecondary: string };
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <View style={{ paddingTop: 2 }}>{icon}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text className="text-caption font-medium" style={{ color: theme.textSecondary }}>{label}</Text>
        <Text className="text-body-lg font-medium" style={{ color: theme.text }}>{title}</Text>
        <Text className="text-caption" style={{ color: theme.textSecondary }}>{sub}</Text>
      </View>
    </View>
  );
}
