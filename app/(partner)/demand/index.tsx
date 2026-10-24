import { Flame } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/src/shared/components/BackButton';
import { DemandMap } from '@/src/shared/components/DemandMap';
import { GlassView } from '@/src/shared/components/GlassView';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { demandSnapshot } from '@/src/data/mockDemand';
import { colors } from '@/src/theme';
import type { DemandZone } from '@/src/types/demand';
import { jobTypeNoun, OFFERED_JOB_TYPE } from '@/src/utils/jobFilters';
import { formatCurrency } from '@/src/utils/money';

const LEVEL_COLOR: Record<DemandZone['level'], string> = {
  HIGH: colors.semantic.error,
  MEDIUM: colors.semantic.warning,
  LOW: colors.semantic.info,
};

const LEVEL_LABEL: Record<DemandZone['level'], string> = {
  HIGH: 'High demand',
  MEDIUM: 'Moderate demand',
  LOW: 'Light demand',
};

export default function DemandScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 48, gap: 16 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>Demand near you</Text>
      </View>

      {demandSnapshot.jobType !== OFFERED_JOB_TYPE ? (
        <GlassView radius="card" style={{ padding: 20, gap: 8, alignItems: 'flex-start' }}>
          <Flame size={20} color={theme.textSecondary} />
          <Text className="text-body" style={{ color: theme.textSecondary }}>
            No demand data for {jobTypeNoun(OFFERED_JOB_TYPE)} orders yet — check back soon.
          </Text>
        </GlassView>
      ) : null}

      {/* <DemandMap zones={demandSnapshot.zones} height={260} scrollEnabled /> */}

      {demandSnapshot.jobType === OFFERED_JOB_TYPE ? (
        <>
        <GlassView radius="card" style={{ padding: 18, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Flame size={18} color={colors.semantic.error} />
            <Text className="text-body-lg font-semibold" style={{ color: theme.text }}>{demandSnapshot.headline}</Text>
          </View>
          <Text className="text-caption" style={{ color: theme.textSecondary }}>
            {demandSnapshot.totalNearbyOrders} {jobTypeNoun(demandSnapshot.jobType)} orders within {demandSnapshot.radiusKm} km
          </Text>
          <Text className="text-display font-bold" style={{ color: colors.partner.orange, marginTop: 4 }}>
            {formatCurrency(demandSnapshot.estimatedHourlyMin)} – {formatCurrency(demandSnapshot.estimatedHourlyMax)}/hr
          </Text>
          <Text className="text-caption" style={{ color: theme.textSecondary }}>estimated earning potential right now</Text>
        </GlassView>

        <View style={{ gap: 10 }}>
          <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8 }}>
            BY AREA
          </Text>
          {demandSnapshot.zones.map((zone) => (
            <GlassView key={zone.id} radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: LEVEL_COLOR[zone.level] }} />
              <View style={{ flex: 1 }}>
                <Text className="text-body-lg font-semibold" style={{ color: theme.text }}>{zone.name}</Text>
                <Text className="text-caption" style={{ color: theme.textSecondary }}>{LEVEL_LABEL[zone.level]}</Text>
              </View>
              <Text className="text-body-lg font-semibold" style={{ color: theme.text }}>
                {zone.nearbyOrders} order{zone.nearbyOrders === 1 ? '' : 's'}
              </Text>
            </GlassView>
          ))}
        </View>
        </>
      ) : null}
    </ScrollView>
  );
}
