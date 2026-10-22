import { Flame } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { demandSnapshot } from '@/src/data/mockDemand';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import type { DemandZone } from '@/src/types/demand';
import { formatCurrency } from '@/src/utils/money';
import { Panel } from '@/src/ui/Panel';
import { ProgressBar } from '@/src/ui/ProgressBar';
import { ScreenHeader } from '@/src/ui/ScreenHeader';

const LEVEL_LABEL: Record<DemandZone['level'], string> = {
  HIGH: 'High demand',
  MEDIUM: 'Moderate demand',
  LOW: 'Light demand',
};

export default function DemandScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTheme();

  const levelColor: Record<DemandZone['level'], string> = {
    HIGH: t.alert,
    MEDIUM: t.warn,
    LOW: t.info,
  };

  const zones = [...demandSnapshot.zones].sort((a, b) => b.nearbyOrders - a.nearbyOrders);
  const maxOrders = Math.max(1, ...zones.map((z) => z.nearbyOrders));

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader title="Demand near you" back />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32, gap: 24 }}>
        {/* The demand map stays disabled, as before. */}
        {/* <DemandMap zones={demandSnapshot.zones} height={260} scrollEnabled /> */}

        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Flame size={18} color={t.alertInk} />
            <Txt variant="heading">{demandSnapshot.headline}</Txt>
          </View>
          <Txt variant="caption" tone="secondary">
            {demandSnapshot.totalNearbyOrders} orders within {demandSnapshot.radiusKm} km
          </Txt>
          <Txt variant="display" style={{ marginTop: 6, fontVariant: ['tabular-nums'] }}>
            {formatCurrency(demandSnapshot.estimatedHourlyMin)} – {formatCurrency(demandSnapshot.estimatedHourlyMax)}
          </Txt>
          <Txt variant="caption" tone="secondary">
            an hour, estimated for right now
          </Txt>
        </View>

        <View style={{ gap: 8 }}>
          <Txt variant="heading" style={{ paddingHorizontal: 4 }}>
            By area
          </Txt>
          <Panel padding={0}>
            {zones.map((zone, i) => (
              <View
                key={zone.id}
                style={{
                  padding: 16,
                  gap: 8,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: t.line,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                  <Txt variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                    {zone.name}
                  </Txt>
                  <Txt variant="body" style={{ fontVariant: ['tabular-nums'] }}>
                    {zone.nearbyOrders} order{zone.nearbyOrders === 1 ? '' : 's'}
                  </Txt>
                </View>
                <ProgressBar progress={zone.nearbyOrders / maxOrders} color={levelColor[zone.level]} />
                <Txt variant="caption" tone="secondary">
                  {LEVEL_LABEL[zone.level]}
                </Txt>
              </View>
            ))}
          </Panel>
        </View>
      </ScrollView>
    </View>
  );
}
