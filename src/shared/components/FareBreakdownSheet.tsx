import { X } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';
import type { Job } from '@/src/types/job';
import { computeFareBreakdown } from '@/src/utils/fare';
import { formatCurrency } from '@/src/utils/money';

interface FareBreakdownSheetProps {
  visible: boolean;
  onClose: () => void;
  job: Job | null;
}

export function FareBreakdownSheet({ visible, onClose, job }: FareBreakdownSheetProps) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  if (!job) return null;
  const fare = computeFareBreakdown(job);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            paddingBottom: 36,
            gap: 14,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text className="text-h1 font-bold" style={{ color: theme.text }}>Delivery earnings</Text>
            <AnimatedPressable onPress={onClose} scaleTo={0.9}>
              <X size={22} color={theme.textSecondary} />
            </AnimatedPressable>
          </View>
          <Text className="text-caption" style={{ color: theme.textSecondary }} numberOfLines={1}>
            {job.pickup.label} → {job.dropoff.label}
          </Text>

          <View style={{ gap: 10, marginTop: 6 }}>
            <FareRow label="Base fare" amount={fare.baseFare} theme={theme} />
            <FareRow label={`Distance (${job.distanceKm.toFixed(1)} km)`} amount={fare.distanceAmount} theme={theme} />
            <FareRow label={`Time (${job.etaMinutes} min)`} amount={fare.timeAmount} theme={theme} />
            {fare.bonus > 0 && <FareRow label="Bonus" amount={fare.bonus} theme={theme} highlight />}
            <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 4 }} />
            <FareRow label="Total" amount={fare.total} theme={theme} bold />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function FareRow({
  label,
  amount,
  theme,
  bold,
  highlight,
}: {
  label: string;
  amount: number;
  theme: { text: string; textSecondary: string };
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text
        className={bold ? 'text-body-lg font-bold' : 'text-body'}
        style={{ color: highlight ? colors.partner.orange : theme.text }}
      >
        {label}
      </Text>
      <Text
        className={bold ? 'text-body-lg font-bold' : 'text-body font-medium'}
        style={{ color: highlight ? colors.partner.orange : theme.text }}
      >
        {formatCurrency(amount)}
      </Text>
    </View>
  );
}
