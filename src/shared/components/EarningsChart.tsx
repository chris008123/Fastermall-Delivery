import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';
import type { LedgerEntry } from '@/src/types/wallet';
import { formatCurrency } from '@/src/utils/money';

const DAY_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CHART_HEIGHT = 90;
const GRIDLINE_FRACTIONS = [0.25, 0.5, 0.75, 1];

interface DayTotal {
  label: string;
  total: number;
  isToday: boolean;
}

function lastSevenDayTotals(ledger: LedgerEntry[]): DayTotal[] {
  const days: DayTotal[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const total = ledger
      .filter((e) => (e.type === 'EARNING' || e.type === 'REIMBURSEMENT') && new Date(e.createdAt).toDateString() === key)
      .reduce((sum, e) => sum + e.amount, 0);
    days.push({ label: DAY_LABEL[d.getDay()], total, isToday: i === 0 });
  }
  return days;
}

/** Sum of the same 7-day window the chart renders, for a header total. */
export function sumLastSevenDays(ledger: LedgerEntry[]): number {
  return lastSevenDayTotals(ledger).reduce((sum, d) => sum + d.total, 0);
}

/** Plain-View bar chart — no charting library, since seven bars don't
 * need one. Combines earnings + reimbursements per day: "how much money
 * came in today", which is what a partner glancing at this actually
 * wants to know, not the two lanes broken out again (that split already
 * lives in the cards above this). Bars grow in on mount, use the same
 * orange gradient as the partner brand's primary button, sit on a
 * baseline with faint reference gridlines, and today's bar gets a subtle
 * ring + bold label so "where am I in the week" is a glance, not a read. */
export function EarningsChart({ ledger }: { ledger: LedgerEntry[] }) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const days = lastSevenDayTotals(ledger);
  const max = Math.max(...days.map((d) => d.total), 1);

  return (
    <View>
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
          {days.map((day, i) => (
            <Bar key={i} day={day} index={i} max={max} theme={theme} />
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {days.map((day, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text
              className={day.isToday ? 'text-caption font-bold' : 'text-caption'}
              style={{ color: day.isToday ? colors.partner.orange : theme.textSecondary }}
            >
              {day.isToday ? 'Today' : day.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Bar({
  day,
  index,
  max,
  theme,
}: {
  day: DayTotal;
  index: number;
  max: number;
  theme: { text: string; border: string };
}) {
  const targetHeight = day.total > 0 ? Math.max((day.total / max) * CHART_HEIGHT, 6) : 3;
  const height = useSharedValue(0);

  useEffect(() => {
    // Staggered grow-in, left to right, so the chart reads as one motion
    // rather than seven bars popping in at once.
    height.value = withDelay(index * 60, withTiming(targetHeight, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [targetHeight, index]);

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ height: CHART_HEIGHT, justifyContent: 'flex-end', width: '100%', alignItems: 'center' }}>
        {day.total > 0 && (
          <Text
            className={day.isToday ? 'text-caption font-bold' : 'text-caption font-semibold'}
            style={{ color: day.isToday ? colors.partner.orange : theme.text, marginBottom: 4, textAlign: 'center' }}
          >
            {formatCurrency(day.total).replace('GH₵ ', '')}
          </Text>
        )}
        <Animated.View
          style={[
            {
              width: 20,
              borderRadius: 6,
              overflow: 'hidden',
              borderWidth: day.isToday ? 1.5 : 0,
              borderColor: colors.partner.orangeBright,
            },
            animatedStyle,
          ]}
        >
          {day.total > 0 ? (
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
