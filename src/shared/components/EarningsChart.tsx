import { Text, View } from 'react-native';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';
import type { LedgerEntry } from '@/src/types/wallet';
import { formatCurrency } from '@/src/utils/money';

const DAY_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CHART_HEIGHT = 90;

interface DayTotal {
  label: string;
  total: number;
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
    days.push({ label: DAY_LABEL[d.getDay()], total });
  }
  return days;
}

/** Plain-View bar chart — no charting library, since seven bars don't
 * need one. Combines earnings + reimbursements per day: "how much money
 * came in today", which is what a partner glancing at this actually
 * wants to know, not the two lanes broken out again (that split already
 * lives in the cards above this). */
export function EarningsChart({ ledger }: { ledger: LedgerEntry[] }) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const days = lastSevenDayTotals(ledger);
  const max = Math.max(...days.map((d) => d.total), 1);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT + 36, gap: 8 }}>
      {days.map((day, i) => {
        const barHeight = day.total > 0 ? Math.max((day.total / max) * CHART_HEIGHT, 6) : 3;
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <View style={{ height: CHART_HEIGHT, justifyContent: 'flex-end' }}>
              {day.total > 0 && (
                <Text className="text-caption font-semibold" style={{ color: theme.text, marginBottom: 4, textAlign: 'center' }}>
                  {formatCurrency(day.total).replace('GH₵ ', '')}
                </Text>
              )}
              <View
                style={{
                  width: 18,
                  height: barHeight,
                  borderRadius: 6,
                  backgroundColor: day.total > 0 ? colors.partner.orange : theme.border,
                }}
              />
            </View>
            <Text className="text-caption" style={{ color: theme.textSecondary }}>{day.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
