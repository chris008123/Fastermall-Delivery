import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, KeyRound, PackageX } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '@/src/shared/components/Badge';
import { Button } from '@/src/shared/components/Button';
import { DeliveryMap } from '@/src/shared/components/DeliveryMap';
import { GlassView } from '@/src/shared/components/GlassView';
import { StarRating } from '@/src/shared/components/StarRating';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { RouteStepper, type RouteStep } from '@/src/shared/components/RouteStepper';
import { pipelineFor, useJobsStore } from '@/src/stores/jobsStore';
import { colors } from '@/src/theme';
import type { Job, JobStage, JobType } from '@/src/types/job';
import { formatCurrency } from '@/src/utils/money';

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
        <PackageX size={32} color={theme.textSecondary} />
        <Text className="text-body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
          This delivery isn't available anymore.
        </Text>
        <Button title="Back to jobs" variant="ghost" onPress={() => router.replace('/jobs')} />
      </View>
    );
  }

  const accent = colors.jobType[job.type].dark;

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

        <Button title="Back to jobs" variant="partner" fullWidth onPress={() => router.replace('/jobs')} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 32, gap: 16 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Badge jobType={job.type} label={job.type} />
        <Text className="text-caption" style={{ color: theme.textSecondary }}>{job.customerName}</Text>
      </View>

      <DeliveryMap job={job} />

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
              onAdvance={() => {
                advanceStage(job.id);
                if (step.key === 'DELIVERED') setCode('');
              }}
            />
          )}
        />
      </GlassView>
    </ScrollView>
  );
}

function StepAction({
  stage,
  job,
  code,
  setCode,
  accent,
  onAdvance,
}: {
  stage: JobStage;
  job: Job;
  code: string;
  setCode: (v: string) => void;
  accent: string;
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
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 4))}
            placeholder="4-digit code"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            maxLength={4}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: accent,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              fontSize: 16,
              letterSpacing: 4,
              // Was missing — the entered digits fell back to default
              // black text, invisible against the dark-mode background.
              // Same class of bug as the earlier back-arrow icon fixes.
              color: theme.text,
            }}
          />
        </View>
        <Button title={label} variant={STEP_VARIANT[job.type]} disabled={code.length < 4} onPress={onAdvance} />
      </View>
    );
  }

  return <Button title={label} variant={STEP_VARIANT[job.type]} onPress={onAdvance} />;
}

function SummaryRow({ label, amount, theme }: { label: string; amount: number; theme: { text: string; textSecondary: string } }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text className="text-body" style={{ color: theme.textSecondary }}>{label}</Text>
      <Text className="text-body-lg font-semibold" style={{ color: theme.text }}>{formatCurrency(amount)}</Text>
    </View>
  );
}
