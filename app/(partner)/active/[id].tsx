import { router, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, CheckCircle2, KeyRound, LifeBuoy, Navigation, PackageX, ShieldAlert } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { BackButton } from '@/src/shared/components/BackButton';
import { Badge } from '@/src/shared/components/Badge';
import { Button } from '@/src/shared/components/Button';
import { FailedDeliverySheet, FAILURE_REASONS } from '@/src/shared/components/FailedDeliverySheet';
import { GlassView } from '@/src/shared/components/GlassView';
import { RouteStepper, type RouteStep } from '@/src/shared/components/RouteStepper';
import { extractDeliveryCode } from '@/src/utils/deliveryCode';
import { SafetySheet } from '@/src/shared/components/SafetySheet';
import { SlideToConfirm } from '@/src/shared/components/SlideToConfirm';
import { StarRating } from '@/src/shared/components/StarRating';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { haptics } from '@/src/shared/utils/haptics';
import { pipelineFor, useJobsStore } from '@/src/stores/jobsStore';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { colors } from '@/src/theme';
import type { FailureReason, Job, JobStage, JobType } from '@/src/types/job';
import { formatCurrency } from '@/src/utils/money';
import { openNavigation } from '@/src/utils/navigation';

// Layout ported from the app's GlassView design system, same merge pattern
// as the rest of the Jobs flow: `advanceStage()`/`failJob()` are the real
// backend-connected mutations — both awaited, with their own loading flags
// and an inline + Alert error surfaced on failure, restored from the
// version of this screen that predates the visual redesign.

const STEP_VARIANT: Record<JobType, 'primary' | 'gold' | 'laundry'> = {
  MARKETPLACE: 'primary',
  FOOD: 'gold',
  LAUNDRY: 'laundry',
};

const STAGE_COPY: Record<JobStage, { label: string; sublabel?: (job: Job) => string; action?: string }> = {
  AVAILABLE: { label: 'Available' },
  ACCEPTED: { label: 'Job accepted', action: 'Start heading to pickup' },
  EN_ROUTE_TO_PICKUP: { label: 'Heading to pickup', sublabel: (j) => j.pickup.label, action: "I've arrived at pickup" },
  PAY_VENDOR: { label: 'Pay the vendor', sublabel: (j) => `Front ${formatCurrency(j.vendorPayoutAmount ?? 0)} \u2014 reimbursed after delivery`, action: 'Mark as paid' },
  PICKED_UP: { label: 'Order collected', sublabel: (j) => j.itemsSummary, action: 'Start heading to customer' },
  EN_ROUTE_TO_CUSTOMER: { label: 'Heading to customer', sublabel: (j) => j.dropoff.label, action: "I've arrived at drop-off" },
  DELIVERED: { label: 'Confirm handover', sublabel: (j) => `Ask ${j.customerName} for their delivery code`, action: 'Confirm handover' },
  COMPLETED: { label: 'Delivery completed' },
  FAILED: { label: 'Delivery failed' },
};

export default function ActiveDeliveryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const [code, setCode] = useState('');

  const job = useJobsStore((s) => s.jobs.find((j) => j.id === id));
  const advanceStage = useJobsStore((s) => s.advanceStage);
  const failJob = useJobsStore((s) => s.failJob);
  const loadJobs = useJobsStore((s) => s.loadJobs);
  const isLoading = useJobsStore((s) => s.isLoading);
  const navigationApp = useSettingsStore((s) => s.navigationApp);

  const [safetyVisible, setSafetyVisible] = useState(false);
  const [failedSheetVisible, setFailedSheetVisible] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isFailing, setIsFailing] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);

  // Deep-linked or opened before the jobs list has loaded — same fallback
  // as the job-detail screen.
  useEffect(() => {
    if (!job && id) {
      void loadJobs();
    }
  }, [job, id, loadJobs]);

  const steps: RouteStep[] = useMemo(() => {
    if (!job) return [];
    const pipeline = pipelineFor(job.type);
    const currentIndex = pipeline.indexOf(job.stage);
    return pipeline.map((stage, index) => ({
      key: stage,
      label: STAGE_COPY[stage].label,
      sublabel: STAGE_COPY[stage].sublabel?.(job),
      status: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming',
    }));
  }, [job]);

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
              This delivery isn't available anymore.
            </Text>
            <Button title="Back to jobs" variant="ghost" onPress={() => router.replace('/(partner)/jobs')} />
          </>
        )}
      </View>
    );
  }

  const accent = colors.jobType[job.type].dark;
  const pipeline = pipelineFor(job.type);
  const pickedUpIndex = pipeline.indexOf('PICKED_UP');
  const currentIndex = pipeline.indexOf(job.stage);
  const navTarget = currentIndex < pickedUpIndex ? job.pickup.coordinate : job.dropoff.coordinate;
  const isFinished = job.stage === 'COMPLETED' || job.stage === 'FAILED';
  const isBusy = isAdvancing || isFailing;

  const handleAdvance = async () => {
    const stageCopy = STAGE_COPY[job.stage];
    if (isBusy || isFinished || !stageCopy.action) return;

    setScreenError(null);
    setIsAdvancing(true);

    try {
      await advanceStage(job.id, code);
      haptics.success();
      if (job.stage === 'DELIVERED') setCode('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update this delivery.';
      setScreenError(message);
      Alert.alert('Unable to update delivery', message);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleFailure = async (reason: FailureReason) => {
    if (isBusy || isFinished) return;

    setFailedSheetVisible(false);
    setScreenError(null);
    setIsFailing(true);

    try {
      await failJob(job.id, reason);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to mark this delivery as failed.';
      setScreenError(message);
      Alert.alert('Unable to update delivery', message);
    } finally {
      setIsFailing(false);
    }
  };

  if (job.stage === 'COMPLETED') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: insets.top + 24, paddingHorizontal: 20, gap: 16 }}>
        <View style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}>
          <CheckCircle2 size={48} color={colors.semantic.success} />
          <Text className="text-h1 font-bold" style={{ color: theme.text }}>Delivery completed</Text>
          <Text className="text-body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
            {job.customerName} confirmed the handover.
          </Text>
          {job.rating != null && (
            <View style={{ alignItems: 'center', gap: 4, marginTop: 4 }}>
              <StarRating rating={job.rating} size={20} />
              <Text className="text-caption" style={{ color: theme.textSecondary }}>
                {job.customerName} rated this delivery {job.rating} star{job.rating === 1 ? '' : 's'}
              </Text>
            </View>
          )}
        </View>

        <GlassView radius="card" style={{ padding: 18, gap: 10 }}>
          {job.vendorPayoutAmount != null && (
            <SummaryRow label="Reimbursed to you" amount={job.vendorPayoutAmount} theme={theme} />
          )}
          <SummaryRow label="Delivery earning" amount={job.deliveryFee} theme={theme} />
        </GlassView>

        <Button title="Back to jobs" variant="partner" fullWidth onPress={() => router.replace('/(partner)/jobs')} />
      </View>
    );
  }

  if (job.stage === 'FAILED') {
    const reasonMeta = FAILURE_REASONS.find((r) => r.key === job.failureReason);
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: insets.top + 24, paddingHorizontal: 20, gap: 16 }}>
        <View style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}>
          <AlertTriangle size={48} color={colors.semantic.error} />
          <Text className="text-h1 font-bold" style={{ color: theme.text }}>Delivery couldn't be completed</Text>
          <Text className="text-body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
            {reasonMeta ? reasonMeta.label : 'This delivery was marked as failed.'} Support has been notified and
            will follow up if anything further is needed.
          </Text>
        </View>

        {job.vendorPayoutAmount != null && (
          <GlassView radius="card" style={{ padding: 18, gap: 10 }}>
            <SummaryRow label="Reimbursed to you" amount={job.vendorPayoutAmount} theme={theme} />
            <Text className="text-caption" style={{ color: theme.textSecondary }}>
              The delivery fee for this job wasn't earned since it couldn't be completed — the vendor cost you
              already covered has still been returned to you.
            </Text>
          </GlassView>
        )}

        <Button title="Back to jobs" variant="partner" fullWidth onPress={() => router.replace('/(partner)/jobs')} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 32, gap: 16 }}
    >
      {/* Nav is hidden on this screen (task-focused, one-way workflow).
          This is purely a navigation pop — the job stays active in the
          store regardless of leaving this screen, so it's safe. */}
      <BackButton />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Badge jobType={job.type} label={job.type} />
        <Text className="text-caption" style={{ color: theme.textSecondary }}>{job.customerName}</Text>
      </View>

      {/* Persistent but unobtrusive — reachable from any stage of an
          active delivery, not tucked behind a menu. */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <AnimatedPressable onPress={() => setSafetyVisible(true)} scaleTo={0.97}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: `${colors.semantic.error}1A`,
            }}
          >
            <ShieldAlert size={14} color={colors.semantic.error} />
            <Text className="text-caption font-semibold" style={{ color: colors.semantic.error }}>Safety</Text>
          </View>
        </AnimatedPressable>

        {/* Goes straight to the Delivery problems topic — not the main
            Support menu — so a partner mid-job never has to dig through
            unrelated topics to reach a relevant answer. */}
        <AnimatedPressable onPress={() => router.push('/(partner)/support/DELIVERY')} scaleTo={0.97}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <LifeBuoy size={14} color={theme.textSecondary} />
            <Text className="text-caption font-semibold" style={{ color: theme.textSecondary }}>Help</Text>
          </View>
        </AnimatedPressable>
      </View>

      {/* Map hidden for now. To bring it back: import DeliveryMap from '@/src/shared/components/DeliveryMap' and render <DeliveryMap job={job} />. */}

      {navigationApp !== 'FASTERMALL_MAPS' && (
        <AnimatedPressable onPress={() => openNavigation(navigationApp, navTarget)} scaleTo={0.98}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Navigation size={16} color={accent} />
            <Text className="text-body-lg font-semibold" style={{ color: theme.text }}>
              Navigate with {navigationApp === 'GOOGLE_MAPS' ? 'Google Maps' : 'Waze'}
            </Text>
          </View>
        </AnimatedPressable>
      )}

      <GlassView radius="card" style={{ padding: 20 }}>
        <RouteStepper
          steps={steps}
          accentColor={accent}
          renderAction={(step) => (
            <StepAction
              stage={step.key as JobStage}
              job={job}
              code={code}
              setCode={setCode}
              accent={accent}
              busy={isBusy}
              onAdvance={() => void handleAdvance()}
            />
          )}
        />
      </GlassView>

      {screenError && (
        <Text className="text-caption" style={{ color: colors.semantic.error, textAlign: 'center' }}>{screenError}</Text>
      )}

      <AnimatedPressable onPress={() => setFailedSheetVisible(true)} scaleTo={0.98} disabled={isBusy}>
        <Text className="text-caption font-semibold" style={{ color: theme.textSecondary, textAlign: 'center' }}>
          Can't complete this delivery?
        </Text>
      </AnimatedPressable>

      <SafetySheet visible={safetyVisible} onClose={() => setSafetyVisible(false)} />
      <FailedDeliverySheet
        visible={failedSheetVisible}
        onClose={() => setFailedSheetVisible(false)}
        customerName={job.customerName}
        onConfirmFailed={(reason) => void handleFailure(reason)}
      />
    </ScrollView>
  );
}

function StepAction({
  stage,
  job,
  code,
  setCode,
  accent,
  busy,
  onAdvance,
}: {
  stage: JobStage;
  job: Job;
  code: string;
  setCode: (v: string) => void;
  accent: string;
  busy: boolean;
  onAdvance: () => void;
}) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const label = STAGE_COPY[stage].action ?? 'Continue';

  if (stage === 'DELIVERED') {
    return (
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <KeyRound size={16} color={accent} />
          <TextInput accessibilityLabel="6-digit delivery code"
            value={code}
            // Pasting a whole message ("Your code is 123456") keeps just the code.
            onChangeText={(v) => setCode(extractDeliveryCode(v))}
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            placeholder="6-digit code"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            editable={!busy}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: accent,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              fontSize: 16,
              letterSpacing: 4,
              color: theme.text,
            }}
          />
        </View>
        <Button title={busy ? 'Confirming…' : label} variant={STEP_VARIANT[job.type]} loading={busy} disabled={code.length < 6} onPress={onAdvance} />
      </View>
    );
  }

  if (stage === 'PAY_VENDOR') {
    // You're paying from your own money, so this one takes a deliberate slide.
    return <SlideToConfirm label="Slide to mark as paid" onConfirm={onAdvance} busy={busy} accent={accent} />;
  }

  return <Button title={busy ? 'Updating…' : label} variant={STEP_VARIANT[job.type]} loading={busy} onPress={onAdvance} />;
}

function SummaryRow({ label, amount, theme }: { label: string; amount: number; theme: { text: string; textSecondary: string } }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text className="text-body" style={{ color: theme.textSecondary }}>{label}</Text>
      <Text className="text-body-lg font-semibold" style={{ color: theme.text }}>{formatCurrency(amount)}</Text>
    </View>
  );
}
