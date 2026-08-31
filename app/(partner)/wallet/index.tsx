import { ArrowDownCircle, Banknote, PiggyBank, RefreshCcw } from 'lucide-react-native';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/src/shared/components/Button';
import { EarningsChart } from '@/src/shared/components/EarningsChart';
import { GlassView } from '@/src/shared/components/GlassView';
import { ProgressBar } from '@/src/shared/components/ProgressBar';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { selectEarningsBalance, selectReimbursedTotal, useWalletStore } from '@/src/stores/walletStore';
import { colors } from '@/src/theme';
import type { LedgerEntry, LedgerEntryType } from '@/src/types/wallet';
import { formatCurrency } from '@/src/utils/money';

const ENTRY_META: Record<LedgerEntryType, { icon: typeof Banknote; label: string }> = {
  EARNING: { icon: Banknote, label: 'Earning' },
  REIMBURSEMENT: { icon: RefreshCcw, label: 'Reimbursement' },
  WITHDRAWAL: { icon: ArrowDownCircle, label: 'Withdrawal' },
};

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  const ledger = useWalletStore((s) => s.ledger);
  const threshold = useWalletStore((s) => s.withdrawalThreshold);
  const withdraw = useWalletStore((s) => s.withdraw);

  const earnings = selectEarningsBalance(ledger);
  const reimbursed = selectReimbursedTotal(ledger);
  const canWithdraw = earnings >= threshold;

  return (
    // paddingBottom: 100 clears the floating glass nav, same convention
    // used on Home and Jobs, now that this list sits under an absolutely
    // positioned nav instead of a native tab bar.
    <FlatList<LedgerEntry>
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 100, gap: 12 }}
      data={ledger}
      keyExtractor={(e) => e.id}
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
            <Text className="text-display font-bold" style={{ color: theme.text }}>{formatCurrency(earnings)}</Text>
            <ProgressBar progress={earnings / threshold} color={colors.partner.orange} />
            <Text className="text-caption" style={{ color: theme.textSecondary }}>
              {canWithdraw
                ? `You've crossed the ${formatCurrency(threshold)} cash-out threshold.`
                : `${formatCurrency(Math.max(threshold - earnings, 0))} more to unlock a cash-out.`}
            </Text>
            <Button title="Cash out" variant="partner" disabled={!canWithdraw} onPress={withdraw} />
          </GlassView>

          <GlassView radius="card" style={{ padding: 18, gap: 12 }}>
            <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8 }}>
              LAST 7 DAYS
            </Text>
            <EarningsChart ledger={ledger} />
          </GlassView>

          <GlassView radius="card" style={{ padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8 }}>
                REIMBURSED
              </Text>
              <Text className="text-h2 font-bold" style={{ color: theme.text }}>{formatCurrency(reimbursed)}</Text>
            </View>
            <Text className="text-caption" style={{ color: theme.textSecondary, maxWidth: 160, textAlign: 'right' }}>
              Your own money, returned instantly — never gated by the threshold above.
            </Text>
          </GlassView>

          <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8, marginTop: 4 }}>
            HISTORY
          </Text>
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 4 }} />}
      renderItem={({ item }) => <LedgerRow entry={item} theme={theme} />}
    />
  );
}

function LedgerRow({ entry, theme }: { entry: LedgerEntry; theme: { text: string; textSecondary: string } }) {
  const meta = ENTRY_META[entry.type];
  const Icon = meta.icon;
  const positive = entry.amount >= 0;
  const iconColor =
    entry.type === 'EARNING' ? colors.partner.orange : entry.type === 'REIMBURSEMENT' ? colors.brand.teal : theme.textSecondary;

  return (
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
          {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </Text>
      </View>
      <Text className="text-body-lg font-semibold" style={{ color: positive ? theme.text : colors.semantic.error }}>
        {positive ? '+' : ''}{formatCurrency(entry.amount)}
      </Text>
    </View>
  );
}
