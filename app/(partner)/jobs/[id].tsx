import { router, useLocalSearchParams } from 'expo-router';
import { Bike, Footprints, PackageX } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/src/ds/haptics';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import { useJobsStore } from '@/src/stores/jobsStore';
import { formatCurrency } from '@/src/utils/money';
import { Button } from '@/src/ui/Button';
import { Notice } from '@/src/ui/Notice';
import { Panel } from '@/src/ui/Panel';
import { RouteLine } from '@/src/ui/RouteLine';
import { ScreenHeader } from '@/src/ui/ScreenHeader';
import { JobTag } from '@/src/ui/Tag';

// The decision screen: what you'd earn, where it goes, and one big button.
// `acceptJob()` is the real backend-connected mutation — awaited, with a
// loading state on the button and any error shown inline and in an Alert
// (a blocking action worth a blocking acknowledgment).
export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t, job: jobColors } = useTheme();

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
  // (deep link, or the list hadn't loaded) rather than from the jobs list.
  useEffect(() => {
    if (!job && id) {
      void loadJobs();
    }
  }, [job, id, loadJobs]);

  if (!job) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <ScreenHeader title="Job details" back />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          {isLoading ? (
            <>
              <ActivityIndicator size="large" color={t.primary} />
              <Txt variant="body" tone="secondary">
                Loading job…
              </Txt>
            </>
          ) : (
            <>
              <PackageX size={32} color={t.inkSecondary} />
              <Txt variant="body" tone="secondary" style={{ textAlign: 'center' }}>
                This job isn't available anymore.
              </Txt>
              <Button title="Back to jobs" variant="secondary" onPress={() => router.replace('/(partner)/jobs')} />
            </>
          )}
        </View>
      </View>
    );
  }

  const colors = jobColors(job.type);
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
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader title="Job details" back />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 20 }}>
        <View style={{ gap: 8 }}>
          <JobTag jobType={job.type} />
          <View>
            <Txt variant="caption" tone="secondary">
              You'll earn
            </Txt>
            <Txt variant="numeral" numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(job.deliveryFee)}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ModeIcon size={16} color={t.inkSecondary} />
            <Txt variant="body" tone="secondary" style={{ fontVariant: ['tabular-nums'] }}>
              {`${job.distanceKm.toFixed(1)} km · about ${job.etaMinutes} min · ${job.partnerMode === 'MOTORCYCLE' ? 'Motorcycle' : 'Walking'}`}
            </Txt>
          </View>
        </View>

        <Panel>
          <RouteLine
            color={colors.solid}
            pickup={{ title: job.pickup.label, sub: job.pickup.sub }}
            dropoff={{ title: job.dropoff.label, sub: `${job.dropoff.sub} · ${job.customerName}` }}
          />
        </Panel>
        {/* The route map preview stays disabled, as before. */}
        {/* <DeliveryMap job={job} showPartner={false} height={160} /> */}

        <View style={{ gap: 6 }}>
          <Txt variant="heading">Items</Txt>
          <Txt variant="body">{job.itemsSummary}</Txt>
        </View>

        {job.vendorPayoutAmount != null && (
          <Notice
            tone="warn"
            title={`Pay ${formatCurrency(job.vendorPayoutAmount)} at the vendor`}
            message={`You pay this from your own money when you collect the order. It goes back to your wallet when the customer confirms delivery, on top of your ${formatCurrency(job.deliveryFee)} earning.`}
          />
        )}

        {screenError && <Notice title="Couldn't accept this job" message={screenError} />}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          backgroundColor: t.bg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: t.line,
        }}
      >
        <Button
          title={isAccepting ? 'Accepting…' : acceptLabel}
          variant="job"
          jobType={job.type}
          size="lg"
          loading={isAccepting}
          disabled={!canAccept}
          fullWidth
          onPress={() => void handleAccept()}
        />
      </View>
    </View>
  );
}
