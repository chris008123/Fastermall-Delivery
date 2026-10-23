import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import { Segmented } from '@/src/ui/Segmented';
import type { LedgerEntry } from '@/src/types/wallet';
import { formatCurrency } from '@/src/utils/money';

const DAY_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CHART_HEIGHT = 90;
const GRIDLINE_FRACTIONS = [0.25, 0.5, 0.75, 1];

interface BarDatum {
  label: string;
  total: number;
  highlight: boolean;
}

function lastSevenDayTotals(ledger: LedgerEntry[]): BarDatum[] {
  const days: BarDatum[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const total = ledger
      .filter((e) => (e.type === 'EARNING' || e.type === 'REIMBURSEMENT') && new Date(e.createdAt).toDateString() === key)
      .reduce((sum, e) => sum + e.amount, 0);
    days.push({ label: DAY_LABEL[d.getDay()], total, highlight: i === 0 });
  }
  return days;
}

/** Same window, bucketed into the last 4 calendar weeks instead of 7 days —
 * the redesign brief's "timeframe selector" requirement, avoiding a
 * 30-bar chart by aggregating rather than trying to cram 30 individual
 * daily bars onto a phone screen. */
function lastFourWeekTotals(ledger: LedgerEntry[]): BarDatum[] {
  const weeks: BarDatum[] = [];
  const now = new Date();
  for (let w = 3; w >= 0; w--) {
    const end = new Date(now);
    end.setDate(end.getDate() - w * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const total = ledger
      .filter((e) => {
        if (e.type !== 'EARNING' && e.type !== 'REIMBURSEMENT') return false;
        const t = new Date(e.createdAt).getTime();
        return t >= start.getTime() && t <= end.getTime();
      })
      .reduce((sum, e) => sum + e.amount, 0);
    weeks.push({ label: w === 0 ? 'This wk' : `-${w}wk`, total, highlight: w === 0 });
  }
  return weeks;
}

/** Sum of the same 7-day window the chart renders, for a header total. */
export function sumLastSevenDays(ledger: LedgerEntry[]): number {
  return lastSevenDayTotals(ledger).reduce((sum, d) => sum + d.total, 0);
}

const RANGE_OPTIONS: { value: '7D' | '4W'; label: string }[] = [
  { value: '7D', label: '7 days' },
  { value: '4W', label: '4 weeks' },
];

/** Plain-View bar chart — no charting library, since seven bars don't
 * need one. Combines earnings + reimbursements per period: "how much money
 * came in", which is what a partner glancing at this actually wants to
 * know (the two-lane split already lives in the cards above it). Bars grow
 * in left to right, the current period is the solid one and earlier ones
 * are paler, and a 7-day/4-week switch stands in for a full timeframe
 * selector without cramming 30 daily bars onto a phone screen. */
export function EarningsChart({ ledger }: { ledger: LedgerEntry[] }) {
  const { t } = useTheme();
  const [range, setRange] = useState<'7D' | '4W'>('7D');
  const data = range === '7D' ? lastSevenDayTotals(ledger) : lastFourWeekTotals(ledger);
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <View style={{ gap: 12 }}>
      <Segmented options={RANGE_OPTIONS} value={range} onChange={setRange} accessibilityLabel="Chart range" />
      <View style={{ height: CHART_HEIGHT + 22 }}>
        {/* Faint reference lines, evenly spaced. No axis labels: this chart
            is for a quick glance, not precise reading. */}
        {GRIDLINE_FRACTIONS.map((f) => (
          <View
            key={f}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: CHART_HEIGHT * f - StyleSheet.hairlineWidth,
              height: StyleSheet.hairlineWidth,
              backgroundColor: t.line,
            }}
          />
        ))}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          {data.map((bar, i) => (
            <Bar key={`${range}-${i}`} bar={bar} index={i} max={max} />
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {data.map((bar, i) => (
          <View key={`${range}-${i}`} style={{ flex: 1, alignItems: 'center' }}>
            <Txt variant={bar.highlight ? 'label' : 'caption'} tone={bar.highlight ? 'ink' : 'secondary'}>
              {range === '7D' && bar.highlight ? 'Today' : bar.label}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

function Bar({ bar, index, max }: { bar: BarDatum; index: number; max: number }) {
  const { t } = useTheme();
  const targetHeight = bar.total > 0 ? Math.max((bar.total / max) * CHART_HEIGHT, 6) : 3;
  const height = useSharedValue(0);

  useEffect(() => {
    // Staggered grow-in, left to right, so the chart reads as one motion.
    // Restarts whenever the range switch changes the dataset.
    height.value = 0;
    height.value = withDelay(index * 60, withTiming(targetHeight, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [targetHeight, index]);

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: CHART_HEIGHT + 22 }}>
      {bar.total > 0 && (
        <Txt
          variant="micro"
          tone={bar.highlight ? 'ink' : 'secondary'}
          style={{ marginBottom: 4, textAlign: 'center', fontVariant: ['tabular-nums'] }}
        >
          {formatCurrency(bar.total).replace('GH₵ ', '')}
        </Txt>
      )}
      <Animated.View
        style={[
          {
            width: 20,
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            backgroundColor: bar.total > 0 ? t.primary : t.line,
            opacity: bar.total > 0 && !bar.highlight ? 0.4 : 1,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}
