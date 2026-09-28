import { ArrowDownCircle, Banknote, Clock3, History, PiggyBank, RefreshCcw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { SectionList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { Button } from '@/src/shared/components/Button';
import { EarningsChart, sumLastSevenDays } from '@/src/shared/components/EarningsChart';
import { FareBreakdownSheet } from '@/src/shared/components/FareBreakdownSheet';
import { GlassView } from '@/src/shared/components/GlassView';
import { NAV_BAR_CLEARANCE } from '@/src/shared/components/FloatingNav';
import { InstantCashoutSheet } from '@/src/shared/components/InstantCashoutSheet';
import { ProgressBar } from '@/src/shared/components/ProgressBar';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useToast } from '@/src/shared/toast/ToastProvider';
import { useJobsStore } from '@/src/stores/jobsStore';
import { selectEarningsBalance, selectReimbursedTotal, useWalletStore } from '@/src/stores/walletStore';
import { colors } from '@/src/theme';
import type { LedgerEntry, LedgerEntryType } from '@/src/types/wallet';
import { nextPayoutDate } from '@/src/utils/date';
import { formatCurrency } from '@/src/utils/money';

const ENTRY_META: Record<LedgerEntryType, { icon: typeof Banknote; label: string }> = {
  EARNING: { icon: Banknote, label: 'Earning' },
  REIMBURSEMENT: { icon: RefreshCcw, label: 'Reimbursement' },
  WITHDRAWAL: { icon: ArrowDownCircle, label: 'Withdrawal' },
};

// Small flat-ish instant-transfer fee, capped so a big balance doesn't
// pay a disproportionate amount — same shape as the mobile-money instant
// transfer fees this is modeling.
function instantFeeFor(balance: number): number {
  return Math.min(Math.round(balance * 0.02 * 100) / 100, 5);
}

/** Groups ledger entries into Today / Yesterday / calendar-date sections,
 * preserving the ledger's existing order within each day. Assumes the
 * ledger already comes newest-first, same as before this grouping — this
 * only inserts headers, it doesn't re-sort. */
function groupLedgerByDate(ledger: LedgerEntry[]): { title: string; data: LedgerEntry[] }[] {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const sections: { title: string; data: LedgerEntry[] }[] = [];
  for (const entry of ledger) {
    const key = new Date(entry.createdAt).toDateString();
    const title =
      key === today ? 'Today' : key === yesterday ? 'Yesterday' : new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
    const section = sections.find((s) => s.title === title);
    if (section) {
      section.data.push(entry);
    } else {
      sections.push({ title, data: [entry] });
    }
  }
  return sections;
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  const ledger = useWalletStore((s) => s.ledger);
  const threshold = useWalletStore((s) => s.withdrawalThreshold);
  const loadWallet = useWalletStore((s) => s.loadWallet);
  const withdraw = useWalletStore((s) => s.withdraw);
  const withdrawInstant = useWalletStore((s) => s.withdrawInstant);
  const jobs = useJobsStore((s) => s.jobs);
  const { show } = useToast();

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const [cashoutVisible, setCashoutVisible] = useState(false);
  const [fareEntry, setFareEntry] = useState<LedgerEntry | null>(null);

  const earnings = selectEarningsBalance(ledger);
  const reimbursed = selectReimbursedTotal(ledger);
  const canWithdraw = earnings >= threshold;
  const instantFee = instantFeeFor(earnings);
  const payoutLabel = nextPayoutDate();
  const fareJob = fareEntry?.jobId ? jobs.find((j) => j.id === fareEntry.jobId) ?? null : null;
  const sections = groupLedgerByDate(ledger);

  return (
    // paddingBottom uses NAV_BAR_CLEARANCE (+ insets.bottom), same
    // convention used on Home and Jobs, now that this list sits under an
    // absolutely positioned nav instead of a native tab bar.
    <SectionList<LedgerEntry, { title: string }>
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: insets.bottom + NAV_BAR_CLEARANCE }}
      sections={sections}
      keyExtractor={(e) => e.id}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={{ gap: 16, marginBottom: 8 }}>
          <Text className="text-h1 font-bold" style={{ color: theme.text }}>Wallet</Text>

          {/* Two lanes, kept visually separate on purpose: reimbursements are
              always yours, earnings only cash out once they cross the
              threshold — blending them into one number would hide that rule. */}
          <GlassView radius="card" intensity="strong" style={{ padding: 20, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PiggyBank size={18} color={colors.partner.orange} />
              <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8 }}>
                WORK EARNINGS
              </Text>
            </View>
            <Text className="text-display font-bold" style={{ color: theme.text, fontVariant: ['tabular-nums'] }}>{formatCurrency(earnings)}</Text>
            <ProgressBar progress={earnings / threshold} color={colors.partner.orange} />
            <Text className="text-caption" style={{ color: theme.textSecondary }}>
              {canWithdraw
                ? `You've crossed the ${formatCurrency(threshold)} cash-out threshold.`
                : `${formatCurrency(Math.max(threshold - earnings, 0))} more to unlock a cash-out.`}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Cash out instantly"
                  variant="partner"
                  disabled={!canWithdraw}
                  onPress={() => setCashoutVisible(true)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Scheduled payout"
                  variant="secondary"
                  disabled={!canWithdraw}
                  onPress={() => {
                    withdraw();
                    show(`${formatCurrency(earnings)} scheduled for ${payoutLabel}`, 'success');
                  }}
                />
              </View>
            </View>
          </GlassView>

          <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.partner.orangeTint,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock3 size={18} color={colors.partner.orange} />
            </View>
            <Text className="text-caption" style={{ color: theme.textSecondary, flex: 1 }}>
              Next automatic payout: <Text style={{ color: theme.text, fontWeight: '600' }}>{payoutLabel}</Text> — free, no fee.
            </Text>
          </GlassView>

          <GlassView radius="card" style={{ padding: 18, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8 }}>
                EARNINGS
              </Text>
              <Text className="text-body-lg font-bold" style={{ color: colors.partner.orange, fontVariant: ['tabular-nums'] }}>
                {formatCurrency(sumLastSevenDays(ledger))} / 7d
              </Text>
            </View>
            <EarningsChart ledger={ledger} />
          </GlassView>

          <GlassView radius="card" style={{ padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.brand.tealTint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <RefreshCcw size={18} color={colors.brand.teal} />
              </View>
              <View>
                <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8 }}>
                  REIMBURSED
                </Text>
                <Text className="text-h2 font-bold" style={{ color: colors.brand.teal, fontVariant: ['tabular-nums'] }}>{formatCurrency(reimbursed)}</Text>
              </View>
            </View>
            <Text className="text-caption" style={{ color: theme.textSecondary, maxWidth: 130, textAlign: 'right' }}>
              Your own money, returned instantly — never gated by the threshold above.
            </Text>
          </GlassView>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Text
          className="text-overline font-semibold"
          style={{ color: theme.textSecondary, letterSpacing: 0.8, marginTop: 16, marginBottom: 8 }}
        >
          {section.title.toUpperCase()}
        </Text>
      )}
      ListEmptyComponent={
        <GlassView radius="card" style={{ padding: 20, alignItems: 'flex-start', gap: 8, marginTop: 16 }}>
          <History size={20} color={theme.textSecondary} />
          <Text className="text-body" style={{ color: theme.textSecondary }}>
            No transactions yet — earnings and reimbursements will show up here once you complete your first job.
          </Text>
        </GlassView>
      }
      ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 4 }} />}
      renderItem={({ item }) => (
        <LedgerRow
          entry={item}
          theme={theme}
          onPress={item.type === 'EARNING' && item.jobId ? () => setFareEntry(item) : undefined}
        />
      )}
      ListFooterComponent={
        <>
          <InstantCashoutSheet
            visible={cashoutVisible}
            onClose={() => setCashoutVisible(false)}
            onConfirm={() => {
              const net = Math.max(earnings - instantFee, 0);
              withdrawInstant(instantFee);
              setCashoutVisible(false);
              show(`${formatCurrency(net)} sent instantly`, 'success');
            }}
            balance={earnings}
            feeAmount={instantFee}
            nextPayoutLabel={payoutLabel}
          />
          <FareBreakdownSheet visible={!!fareEntry} onClose={() => setFareEntry(null)} job={fareJob} />
        </>
      }
    />
  );
}

function LedgerRow({
  entry,
  theme,
  onPress,
}: {
  entry: LedgerEntry;
  theme: { text: string; textSecondary: string };
  onPress?: () => void;
}) {
  const meta = ENTRY_META[entry.type];
  const Icon = meta.icon;
  const positive = entry.amount >= 0;
  const iconColor =
    entry.type === 'EARNING' ? colors.partner.orange : entry.type === 'REIMBURSEMENT' ? colors.brand.teal : theme.textSecondary;
  // Amount color follows entry type, not sign — a withdrawal's negative
  // amount is a routine, deliberate cash-out, not an error, so it stays
  // neutral instead of red like the semantic.error earlier version used.
  const amountColor = entry.type === 'EARNING' ? colors.partner.orange : entry.type === 'REIMBURSEMENT' ? colors.brand.teal : theme.text;

  const Row = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${iconColor}1a`,
        }}
      >
        <Icon size={16} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text className="text-body font-medium" style={{ color: theme.text }} numberOfLines={1}>
          {entry.note}
        </Text>
        <Text className="text-caption" style={{ color: theme.textSecondary }}>
          {meta.label}
        </Text>
      </View>
      <Text className="text-body-lg font-semibold" style={{ color: amountColor, fontVariant: ['tabular-nums'] }}>
        {positive ? '+' : ''}{formatCurrency(entry.amount)}
      </Text>
    </View>
  );

  if (!onPress) return Row;

  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.99}>
      {Row}
    </AnimatedPressable>
  );
}
