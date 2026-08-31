import { router } from 'expo-router';
import { Bell, ChevronRight, MapPin, PackageSearch, Zap } from 'lucide-react-native';
import { ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { Badge } from '@/src/shared/components/Badge';
import { Button } from '@/src/shared/components/Button';
import { GlassView } from '@/src/shared/components/GlassView';
import { ProgressBar } from '@/src/shared/components/ProgressBar';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useJobsStore } from '@/src/stores/jobsStore';
import { selectUnreadCount, useNotificationsStore } from '@/src/stores/notificationsStore';
import { usePartnerStore } from '@/src/stores/partnerStore';
import { selectEarningsBalance, selectReimbursedTotal, useWalletStore } from '@/src/stores/walletStore';
import { colors } from '@/src/theme';
import { formatCurrency } from '@/src/utils/money';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  const partner = usePartnerStore();
  const jobs = useJobsStore((s) => s.jobs);
  const ledger = useWalletStore((s) => s.ledger);
  const threshold = useWalletStore((s) => s.withdrawalThreshold);
  const unreadCount = useNotificationsStore((s) => selectUnreadCount(s.notifications));

  const availableCount = jobs.filter((j) => j.stage === 'AVAILABLE').length;
  const activeJob = jobs.find((j) => j.stage !== 'AVAILABLE' && j.stage !== 'COMPLETED' && j.stage !== 'FAILED');
  const earnings = selectEarningsBalance(ledger);
  const reimbursed = selectReimbursedTotal(ledger);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      // paddingBottom: 100 clears the floating glass nav (same value the
      // customer app uses) now that this screen sits under a floating,
      // absolutely-positioned nav instead of a native tab bar that used
      // to reserve its own space automatically.
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 100, gap: 16 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text className="text-caption" style={{ color: theme.textSecondary }}>Welcome back</Text>
          <Text className="text-h1 font-bold" style={{ color: theme.text }}>{partner.name}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <AnimatedPressable onPress={() => router.push('/notifications')} scaleTo={0.9}>
            <View>
              <Bell size={24} color={theme.text} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    paddingHorizontal: 3,
                    backgroundColor: colors.partner.orange,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{unreadCount}</Text>
                </View>
              )}
            </View>
          </AnimatedPressable>
          <View style={{ alignItems: 'center' }}>
            <Switch
              value={partner.isAvailable}
              onValueChange={partner.setAvailable}
              trackColor={{ false: theme.border, true: colors.partner.orangeTint }}
              thumbColor={partner.isAvailable ? colors.partner.orange : theme.surfaceRaised}
            />
            <Text className="text-caption font-medium" style={{ color: partner.isAvailable ? colors.partner.orange : theme.textSecondary, marginTop: 2 }}>
              {partner.isAvailable ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>

      {!partner.isAvailable && !activeJob && (
        <GlassView radius="card" style={{ padding: 20, alignItems: 'flex-start', gap: 10 }}>
          <Zap size={22} color={colors.partner.orange} />
          <Text className="text-card-title font-semibold" style={{ color: theme.text }}>
            You're offline
          </Text>
          <Text className="text-body" style={{ color: theme.textSecondary }}>
            Go online to start receiving Marketplace, Food, and Laundry jobs near you.
          </Text>
          <Button title="Go online" variant="partner" onPress={() => partner.setAvailable(true)} />
        </GlassView>
      )}

      {activeJob && (
        <AnimatedPressable onPress={() => router.push(`/active/${activeJob.id}`)} scaleTo={0.98}>
          <GlassView radius="card" intensity="strong" style={{ padding: 20, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge jobType={activeJob.type} label={activeJob.type} />
              <ChevronRight size={20} color={theme.textSecondary} />
            </View>
            <Text className="text-card-title font-semibold" style={{ color: theme.text }}>
              Active delivery in progress
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MapPin size={16} color={theme.textSecondary} />
              <Text className="text-body" style={{ color: theme.textSecondary }} numberOfLines={1}>
                {activeJob.dropoff.label}
              </Text>
            </View>
            <Button title="Continue delivery" variant="partner" onPress={() => router.push(`/active/${activeJob.id}`)} />
          </GlassView>
        </AnimatedPressable>
      )}

      {partner.isAvailable && !activeJob && availableCount > 0 && (
        <AnimatedPressable onPress={() => router.push('/jobs')} scaleTo={0.98}>
          <GlassView radius="card" style={{ padding: 20, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text className="text-card-title font-semibold" style={{ color: theme.text }}>
                {availableCount} job{availableCount === 1 ? '' : 's'} available
              </Text>
              <ChevronRight size={20} color={theme.textSecondary} />
            </View>
            <Text className="text-body" style={{ color: theme.textSecondary }}>
              Browse and accept a Marketplace, Food, or Laundry job.
            </Text>
          </GlassView>
        </AnimatedPressable>
      )}

      {partner.isAvailable && !activeJob && availableCount === 0 && (
        <GlassView radius="card" style={{ padding: 20, alignItems: 'flex-start', gap: 8 }}>
          <PackageSearch size={22} color={theme.textSecondary} />
          <Text className="text-card-title font-semibold" style={{ color: theme.text }}>
            No jobs nearby right now
          </Text>
          <Text className="text-body" style={{ color: theme.textSecondary }}>
            You're online and ready — a new Marketplace, Food, or Laundry job will show up here as soon as one opens up.
          </Text>
        </GlassView>
      )}

      <AnimatedPressable onPress={() => router.push('/wallet')} scaleTo={0.98}>
        <GlassView radius="card" style={{ padding: 20, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8 }}>
              WALLET
            </Text>
            <ChevronRight size={18} color={theme.textSecondary} />
          </View>
          <Text className="text-display font-bold" style={{ color: theme.text }}>{formatCurrency(earnings)}</Text>
          <Text className="text-caption" style={{ color: theme.textSecondary }}>
            toward your {formatCurrency(threshold)} cash-out
          </Text>
          <ProgressBar progress={earnings / threshold} color={colors.partner.orange} />
          <Text className="text-caption" style={{ color: theme.textSecondary }}>
            + {formatCurrency(reimbursed)} already reimbursed to you
          </Text>
        </GlassView>
      </AnimatedPressable>
    </ScrollView>
  );
}
