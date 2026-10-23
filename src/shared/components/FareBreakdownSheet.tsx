import { StyleSheet, View } from 'react-native';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import type { Job } from '@/src/types/job';
import { computeFareBreakdown } from '@/src/utils/fare';
import { formatCurrency } from '@/src/utils/money';
import { Sheet } from '@/src/ui/Sheet';

interface FareBreakdownSheetProps {
  visible: boolean;
  onClose: () => void;
  job: Job | null;
}

/** How one delivery's earning was worked out: base, distance, time, any
 * bonus, then the total. */
export function FareBreakdownSheet({ visible, onClose, job }: FareBreakdownSheetProps) {
  const { t } = useTheme();

  if (!job) return null;
  const fare = computeFareBreakdown(job);

  return (
    <Sheet visible={visible} onClose={onClose} title="Delivery earnings">
      <View style={{ gap: 14, paddingTop: 4 }}>
        <Txt variant="caption" tone="secondary" numberOfLines={1}>
          {job.pickup.label} → {job.dropoff.label}
        </Txt>

        <View style={{ gap: 10 }}>
          <FareRow label="Base fare" amount={fare.baseFare} />
          <FareRow label={`Distance (${job.distanceKm.toFixed(1)} km)`} amount={fare.distanceAmount} />
          <FareRow label={`Time (${job.etaMinutes} min)`} amount={fare.timeAmount} />
          {fare.bonus > 0 && <FareRow label="Bonus" amount={fare.bonus} good />}
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.lineStrong, marginVertical: 4 }} />
          <FareRow label="Total" amount={fare.total} strong />
        </View>
      </View>
    </Sheet>
  );
}

function FareRow({ label, amount, strong, good }: { label: string; amount: number; strong?: boolean; good?: boolean }) {
  const variant = strong ? 'heading' : 'body';
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
      <Txt variant={variant} tone={good ? 'go' : strong ? 'ink' : 'secondary'} style={{ flexShrink: 1 }}>
        {label}
      </Txt>
      <Txt variant={strong ? 'heading' : 'bodyStrong'} tone={good ? 'go' : 'ink'} style={{ fontVariant: ['tabular-nums'] }}>
        {formatCurrency(amount)}
      </Txt>
    </View>
  );
}
