import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';
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

/** Plain-View bar chart — no charting library, since seven bars don't
 * need one. Combines earnings + reimbursements per period: "how much money
 * came in", which is what a partner glancing at this actually wants to
 * know, not the two lanes broken out again (that split already lives in
 * the cards above this). Bars grow in on mount, use the same orange
 * gradient as the partner brand's primary button, sit on a baseline with
 * faint reference gridlines, and the current period's bar gets a subtle
 * ring + bold label so "where am I" is a glance, not a read. A 7-day/
 * 4-week toggle stands in for a full timeframe selector without trying to
 * cram 30 individual daily bars onto a phone screen. */
export function EarningsChart({ ledger }: { ledger: LedgerEntry[] }) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const [range, setRange] = useState<'7D' | '4W'>('7D');
  const data = range === '7D' ? lastSevenDayTotals(ledger) : lastFourWeekTotals(ledger);
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
        <RangeChip label="7 days" active={range === '7D'} onPress={() => setRange('7D')} theme={theme} />
        <RangeChip label="4 weeks" active={range === '4W'} onPress={() => setRange('4W')} theme={theme} />
      </View>
      <View style={{ height: CHART_HEIGHT, marginBottom: 4 }}>
        {/* Faint horizontal reference lines, evenly spaced, purely decorative
            scale cues — no axis labels, this chart is for a quick glance
            not precise reading. */}
        {GRIDLINE_FRACTIONS.map((f) => (
          <View
            key={f}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: CHART_HEIGHT * f - 1,
              height: 1,
              backgroundColor: theme.border,
              opacity: 0.4,
            }}
          />
        ))}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          {data.map((bar, i) => (
            <Bar key={`${range}-${i}`} bar={bar} index={i} max={max} theme={theme} />
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {data.map((bar, i) => (
          <View key={`${range}-${i}`} style={{ flex: 1, alignItems: 'center' }}>
            <Text
              className={bar.highlight ? 'text-caption font-bold' : 'text-caption'}
              style={{ color: bar.highlight ? colors.partner.orange : theme.textSecondary }}
            >
              {range === '7D' && bar.highlight ? 'Today' : bar.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function RangeChip({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: { border: string; textSecondary: string };
}) {
  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.96}>
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: active ? colors.partner.orangeTint : 'transparent',
          borderWidth: 1.5,
          borderColor: active ? colors.partner.orange : theme.border,
        }}
      >
        <Text className="text-caption font-semibold" style={{ color: active ? colors.partner.orange : theme.textSecondary }}>
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

function Bar({
  bar,
  index,
  max,
  theme,
}: {
  bar: BarDatum;
  index: number;
  max: number;
  theme: { text: string; border: string };
}) {
  const targetHeight = bar.total > 0 ? Math.max((bar.total / max) * CHART_HEIGHT, 6) : 3;
  const height = useSharedValue(0);

  useEffect(() => {
    // Staggered grow-in, left to right, so the chart reads as one motion
    // rather than several bars popping in at once. Restarts (rather than
    // holding at the old value) whenever the timeframe toggle changes the
    // dataset — the effect re-fires because `targetHeight` changes too.
    height.value = 0;
    height.value = withDelay(index * 60, withTiming(targetHeight, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [targetHeight, index]);

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ height: CHART_HEIGHT, justifyContent: 'flex-end', width: '100%', alignItems: 'center' }}>
        {bar.total > 0 && (
          <Text
            className={bar.highlight ? 'text-caption font-bold' : 'text-caption font-semibold'}
            style={{
              color: bar.highlight ? colors.partner.orange : theme.text,
              marginBottom: 4,
              textAlign: 'center',
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatCurrency(bar.total).replace('GH₵ ', '')}
          </Text>
        )}
        <Animated.View
          style={[
            {
              width: 20,
              borderRadius: 6,
              overflow: 'hidden',
              borderWidth: bar.highlight ? 1.5 : 0,
              borderColor: colors.partner.orangeBright,
            },
            animatedStyle,
          ]}
        >
          {bar.total > 0 ? (
            <LinearGradient
              colors={[colors.partner.orangeBright, colors.partner.orangeDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ flex: 1 }}
            />
          ) : (
            <View style={{ flex: 1, backgroundColor: theme.border }} />
          )}
        </Animated.View>
      </View>
    </View>
  );
}
