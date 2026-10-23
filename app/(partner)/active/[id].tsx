import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck, Navigation, PackageX, ShieldAlert, TriangleAlert } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/src/ds/haptics';
import { radii } from '@/src/ds/tokens';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import { FailedDeliverySheet, FAILURE_REASONS } from '@/src/shared/components/FailedDeliverySheet';
import { RouteStepper, type RouteStep } from '@/src/shared/components/RouteStepper';
import { SafetySheet } from '@/src/shared/components/SafetySheet';
import { StarRating } from '@/src/shared/components/StarRating';
import { pipelineFor, useJobsStore } from '@/src/stores/jobsStore';
import { useSettingsStore } from '@/src/stores/settingsStore';
import type { FailureReason, Job, JobStage } from '@/src/types/job';
import { formatCurrency } from '@/src/utils/money';
import { openNavigation } from '@/src/utils/navigation';
import { Button } from '@/src/ui/Button';
import { Notice } from '@/src/ui/Notice';
import { SlideToConfirm } from '@/src/ui/SlideToConfirm';
import { Panel } from '@/src/ui/Panel';
import { ScreenHeader } from '@/src/ui/ScreenHeader';
import { JobTag } from '@/src/ui/Tag';

// The screen a partner uses under the most pressure, so it's built around
// two things: what's happening now (large, top) and the one action that
// moves the delivery forward (pinned at the bottom, in thumb reach). The
// full route sits between them for context. `advanceStage()` and
// `failJob()` are the real backend-connected mutations — both awaited,
// with their own loading flags and an inline + Alert error on failure,
// unchanged from the previous version of this screen.

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
  const { t, job: jobColors } = useTheme();
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
      status: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming',
    }));
  }, [job]);

  if (!job) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <ScreenHeader title="Delivery" back />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          {isLoading ? (
            <>
              <ActivityIndicator size="large" color={t.primary} />
              <Txt variant="body" tone="secondary">
                Loading delivery…
              </Txt>
            </>
          ) : (
            <>
              <PackageX size={32} color={t.inkSecondary} />
              <Txt variant="body" tone="secondary" style={{ textAlign: 'center' }}>
                This delivery isn't available anymore.
              </Txt>
              <Button title="Back to jobs" variant="secondary" onPress={() => router.replace('/(partner)/jobs')} />
            </>
          )}
        </View>
      </View>
    );
  }

  const jc = jobColors(job.type);
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
      <ScrollView
        style={{ flex: 1, backgroundColor: t.bg }}
        contentContainerStyle={{ paddingTop: insets.top + 40, paddingHorizontal: 20, paddingBottom: insets.bottom + 24, gap: 24 }}
      >
        <View style={{ alignItems: 'center', gap: 8 }}>
          <CircleCheck size={56} color={t.goInk} />
          <Txt variant="display" style={{ textAlign: 'center' }}>
            Delivery completed
          </Txt>
          <Txt variant="body" tone="secondary" style={{ textAlign: 'center' }}>
            {job.customerName} confirmed the handover.
          </Txt>
          {job.rating != null && (
            <View style={{ alignItems: 'center', gap: 4, marginTop: 8 }}>
              <StarRating rating={job.rating} size={22} mutedColor={t.lineStrong} />
              <Txt variant="caption" tone="secondary">
                Rated {job.rating} star{job.rating === 1 ? '' : 's'}
              </Txt>
            </View>
          )}
        </View>

        <View style={{ alignItems: 'center' }}>
          <Txt variant="caption" tone="secondary">
            You earned
          </Txt>
          <Txt variant="numeral" numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(job.deliveryFee)}
          </Txt>
        </View>

        {job.vendorPayoutAmount != null && (
          <Panel style={{ gap: 4 }}>
            <SummaryRow label="Reimbursed to you" amount={job.vendorPayoutAmount} />
          </Panel>
        )}

        <Button title="Back to jobs" size="lg" fullWidth onPress={() => router.replace('/(partner)/jobs')} />
      </ScrollView>
    );
  }

  if (job.stage === 'FAILED') {
    const reasonMeta = FAILURE_REASONS.find((r) => r.key === job.failureReason);
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: t.bg }}
        contentContainerStyle={{ paddingTop: insets.top + 40, paddingHorizontal: 20, paddingBottom: insets.bottom + 24, gap: 24 }}
      >
        <View style={{ alignItems: 'center', gap: 8 }}>
          <TriangleAlert size={56} color={t.alertInk} />
          <Txt variant="display" style={{ textAlign: 'center' }}>
            Couldn't complete this delivery
          </Txt>
          <Txt variant="body" tone="secondary" style={{ textAlign: 'center' }}>
            {reasonMeta ? `${reasonMeta.label}. ` : 'This delivery was marked as failed. '}
            Support has been notified and will follow up if anything more is needed.
          </Txt>
        </View>

        {job.vendorPayoutAmount != null && (
          <Panel style={{ gap: 8 }}>
            <SummaryRow label="Reimbursed to you" amount={job.vendorPayoutAmount} />
            <Txt variant="caption" tone="secondary">
              You don't earn the delivery fee when a job can't be completed, but the vendor cost you already paid
              has been returned to you.
            </Txt>
          </Panel>
        )}

        <Button title="Back to jobs" size="lg" fullWidth onPress={() => router.replace('/(partner)/jobs')} />
      </ScrollView>
    );
  }

  const stageCopy = STAGE_COPY[job.stage];
  const stepNumber = Math.max(currentIndex, 0) + 1;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Leaving this screen only pops navigation — the job stays active in
          the store, so the back arrow is safe. */}
      <ScreenHeader
        title="Delivery"
        back
        right={
          <Pressable
            onPress={() => setSafetyVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Safety"
            style={({ pressed }) => ({
              minHeight: 44,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: t.alertTint,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <ShieldAlert size={18} color={t.alertInk} />
            <Txt variant="label" tone="alert">
              Safety
            </Txt>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <JobTag jobType={job.type} />
            <Txt variant="caption" tone="secondary" style={{ fontVariant: ['tabular-nums'] }}>
              Step {stepNumber} of {pipeline.length}
            </Txt>
          </View>
          <Txt variant="display" accessibilityRole="header">
            {stageCopy.label}
          </Txt>
          {stageCopy.sublabel ? (
            <Txt variant="body" tone="secondary">
              {stageCopy.sublabel(job)}
            </Txt>
          ) : null}
          <Txt variant="caption" tone="secondary">
            {job.customerName}
          </Txt>
        </View>

        {/* The live map stays disabled, as before. */}
        {/* <DeliveryMap job={job} /> */}

        {navigationApp !== 'FASTERMALL_MAPS' && (
          <Button
            title={`Navigate with ${navigationApp === 'GOOGLE_MAPS' ? 'Google Maps' : 'Waze'}`}
            variant="secondary"
            fullWidth
            icon={<Navigation size={18} color={t.ink} />}
            onPress={() => openNavigation(navigationApp, navTarget)}
          />
        )}

        <Panel>
          <RouteStepper steps={steps} accentColor={jc.solid} />
        </Panel>

        {screenError && <Notice title="Couldn't update this delivery" message={screenError} />}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Pressable
            onPress={() => router.push('/(partner)/support/DELIVERY')}
            accessibilityRole="button"
            hitSlop={8}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Txt variant="label" tone="primary">
              Get help
            </Txt>
          </Pressable>
          <Pressable
            onPress={() => setFailedSheetVisible(true)}
            disabled={isBusy}
            accessibilityRole="button"
            hitSlop={8}
            style={{ minHeight: 44, justifyContent: 'center', opacity: isBusy ? 0.5 : 1 }}
          >
            <Txt variant="label" tone="secondary">
              Can't complete this delivery?
            </Txt>
          </Pressable>
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          gap: 10,
          backgroundColor: t.bg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: t.line,
        }}
      >
        <StepAction
          stage={job.stage}
          job={job}
          code={code}
          setCode={setCode}
          accent={jc.solid}
          busy={isBusy}
          onAdvance={() => void handleAdvance()}
        />
      </View>

      <SafetySheet visible={safetyVisible} onClose={() => setSafetyVisible(false)} />
      <FailedDeliverySheet
        visible={failedSheetVisible}
        onClose={() => setFailedSheetVisible(false)}
        customerName={job.customerName}
        onConfirmFailed={(reason) => void handleFailure(reason)}
      />
    </KeyboardAvoidingView>
  );
}

/** The one action that moves the delivery forward, pinned to the bottom.
 * At handover it adds the customer's 6-digit code above the button. */
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
  const { t, job: jobColors } = useTheme();
  const [focused, setFocused] = useState(false);
  const label = STAGE_COPY[stage].action ?? 'Continue';

  if (stage === 'DELIVERED') {
    return (
      <>
        <TextInput
          value={code}
          onChangeText={(v) => {
            // Pasting a whole message ("Your code is 123456") keeps just the code.
            const run = v.length > 6 ? v.match(/\d{6}/) : null;
            setCode(run ? run[0] : v.replace(/[^0-9]/g, '').slice(0, 6));
          }}
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          placeholder="• • • • • •"
          placeholderTextColor={t.inkTertiary}
          keyboardType="number-pad"
          editable={!busy}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={`Delivery code from ${job.customerName}`}
          style={{
            height: 64,
            borderRadius: radii.md,
            borderWidth: 2,
            borderColor: focused ? accent : t.lineStrong,
            backgroundColor: t.surface,
            color: t.ink,
            textAlign: 'center',
            fontSize: 28,
            letterSpacing: 10,
            fontFamily: 'Archivo_700Bold',
          }}
        />
        <Button
          title={busy ? 'Confirming…' : label}
          variant="job"
          jobType={job.type}
          size="lg"
          fullWidth
          loading={busy}
          disabled={code.length < 6}
          onPress={onAdvance}
        />
      </>
    );
  }

  if (stage === 'PAY_VENDOR') {
    // You're paying from your own money, so this one takes a deliberate slide.
    const jc = jobColors(job.type);
    return (
      <SlideToConfirm
        label="Slide to mark as paid"
        onConfirm={onAdvance}
        busy={busy}
        accent={jc.solid}
        onAccent={jc.onSolid}
      />
    );
  }

  return (
    <Button
      title={busy ? 'Updating…' : label}
      variant="job"
      jobType={job.type}
      size="lg"
      fullWidth
      loading={busy}
      onPress={onAdvance}
    />
  );
}

function SummaryRow({ label, amount }: { label: string; amount: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <Txt variant="body" tone="secondary">
        {label}
      </Txt>
      <Txt variant="heading" style={{ fontVariant: ['tabular-nums'] }}>
        {formatCurrency(amount)}
      </Txt>
    </View>
  );
}
