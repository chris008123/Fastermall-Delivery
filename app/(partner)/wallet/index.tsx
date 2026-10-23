import { ArrowDownCircle, Banknote, ChevronRight, RefreshCcw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { haptics } from '@/src/shared/utils/haptics';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import { EarningsChart, sumLastSevenDays } from '@/src/shared/components/EarningsChart';
import { FareBreakdownSheet } from '@/src/shared/components/FareBreakdownSheet';
import { InstantCashoutSheet } from '@/src/shared/components/InstantCashoutSheet';
import { useToast } from '@/src/shared/toast/ToastProvider';
import { useJobsStore } from '@/src/stores/jobsStore';
import { selectEarningsBalance, selectReimbursedTotal, useWalletStore } from '@/src/stores/walletStore';
import type { LedgerEntry, LedgerEntryType } from '@/src/types/wallet';
import { nextPayoutDate } from '@/src/utils/date';
import { formatCurrency } from '@/src/utils/money';
import { useNavClearance } from '@/src/shared/components/AppNav';
import { Button } from '@/src/ui/Button';
import { Panel } from '@/src/ui/Panel';
import { ProgressBar } from '@/src/ui/ProgressBar';
import { ScreenHeader } from '@/src/ui/ScreenHeader';

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
 * ledger already comes newest-first — this only inserts headers, it
 * doesn't re-sort. */
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
  const { t } = useTheme();
  const navClearance = useNavClearance();

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
  const lastCashout = ledger.find((e) => e.type === 'WITHDRAWAL');
  const lastCashoutLabel = lastCashout
    ? new Date(lastCashout.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader title="Wallet" />
      <SectionList<LedgerEntry, { title: string }>
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: navClearance }}
        sections={sections}
        keyExtractor={(e) => e.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={{ gap: 24, marginBottom: 8 }}>
            {/* Two lanes, kept visually separate on purpose: reimbursements
                are always yours, earnings only cash out once they cross the
                threshold. Blending them into one number would hide that rule. */}
            <View style={{ gap: 14 }}>
              <View>
                <Txt variant="caption" tone="secondary">
                  Work earnings
                </Txt>
                <Txt variant="numeral" numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(earnings)}
                </Txt>
              </View>
              <View style={{ gap: 8 }}>
                <ProgressBar progress={threshold > 0 ? earnings / threshold : 0} />
                <Txt variant="caption" tone="secondary">
                  {canWithdraw
                    ? `You've crossed the ${formatCurrency(threshold)} cash-out threshold.`
                    : `${formatCurrency(Math.max(threshold - earnings, 0))} more to unlock a cash-out.`}
                  {lastCashoutLabel ? ` Last cash-out: ${lastCashoutLabel}.` : ''}
                </Txt>
              </View>
              <View style={{ gap: 8 }}>
                <Button
                  title="Cash out instantly"
                  size="lg"
                  fullWidth
                  disabled={!canWithdraw}
                  onPress={() => setCashoutVisible(true)}
                />
                <Button
                  title="Scheduled payout"
                  variant="secondary"
                  fullWidth
                  disabled={!canWithdraw}
                  onPress={() => {
                    withdraw();
                    haptics.success();
                    show(`${formatCurrency(earnings)} scheduled for ${payoutLabel}`, 'success');
                  }}
                />
              </View>
              <Txt variant="caption" tone="secondary">
                Next automatic payout: <Txt variant="caption" style={{ fontFamily: 'Fredoka_700Bold' }}>{payoutLabel}</Txt>. Free, no fee.
              </Txt>
            </View>

            <Panel style={{ gap: 6 }}>
              <Txt variant="heading">Reimbursed</Txt>
              <Txt variant="display" style={{ fontVariant: ['tabular-nums'] }}>
                {formatCurrency(reimbursed)}
              </Txt>
              <Txt variant="caption" tone="secondary">
                Your own money, returned instantly. The cash-out threshold doesn't apply to it.
              </Txt>
            </Panel>

            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Txt variant="heading">Earnings</Txt>
                <Txt variant="caption" tone="secondary" style={{ fontVariant: ['tabular-nums'] }}>
                  {formatCurrency(sumLastSevenDays(ledger))} in the last 7 days
                </Txt>
              </View>
              <Panel>
                <EarningsChart ledger={ledger} />
              </Panel>
            </View>

            {sections.length > 0 && <Txt variant="heading">Activity</Txt>}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Txt variant="label" tone="secondary" style={{ marginTop: 12, marginBottom: 4 }}>
            {section.title}
          </Txt>
        )}
        ListEmptyComponent={
          <Panel style={{ gap: 4 }}>
            <Txt variant="heading">No transactions yet</Txt>
            <Txt variant="body" tone="secondary">
              Earnings and reimbursements will show up here once you complete your first job.
            </Txt>
          </Panel>
        }
        ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.line }} />}
        renderItem={({ item }) => (
          <LedgerRow entry={item} onPress={item.type === 'EARNING' && item.jobId ? () => setFareEntry(item) : undefined} />
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
                haptics.success();
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
    </View>
  );
}

function LedgerRow({ entry, onPress }: { entry: LedgerEntry; onPress?: () => void }) {
  const { t } = useTheme();
  const meta = ENTRY_META[entry.type];
  const Icon = meta.icon;
  const positive = entry.amount >= 0;
  // Money coming in reads green; a withdrawal's negative amount is a
  // routine, deliberate cash-out, not an error, so it stays neutral.
  const comingIn = entry.type !== 'WITHDRAWAL';

  const content = (pressed: boolean) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 60,
        paddingVertical: 10,
        opacity: pressed ? 0.6 : 1,
      }}
    >
      <Icon size={20} color={t.inkSecondary} />
      <View style={{ flex: 1 }}>
        <Txt variant="body" numberOfLines={1}>
          {entry.note}
        </Txt>
        <Txt variant="caption" tone="secondary">
          {meta.label}
        </Txt>
      </View>
      <Txt variant="bodyStrong" tone={comingIn ? 'go' : 'ink'} style={{ fontVariant: ['tabular-nums'] }}>
        {positive ? '+' : ''}
        {formatCurrency(entry.amount)}
      </Txt>
      {onPress ? <ChevronRight size={16} color={t.inkTertiary} /> : null}
    </View>
  );

  if (!onPress) return content(false);

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${entry.note}, see how this was calculated`}>
      {({ pressed }) => content(pressed)}
    </Pressable>
  );
}
