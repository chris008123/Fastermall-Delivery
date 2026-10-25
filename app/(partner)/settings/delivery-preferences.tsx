import { router } from 'expo-router';
import { Bike, Check, Minus, Package, Plus, Soup } from 'lucide-react-native';
import { ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { BackButton } from '@/src/shared/components/BackButton';
import { GlassView } from '@/src/shared/components/GlassView';
import { SettingsRow } from '@/src/shared/components/SettingsRow';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { usePartnerStore } from '@/src/stores/partnerStore';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { colors } from '@/src/theme';

const RADIUS_MIN = 1;
const DISTANCE_MIN = 5;
const DISTANCE_MAX = 50;

export default function DeliveryPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const partner = usePartnerStore();
  const deliveryPrefs = useSettingsStore((s) => s.deliveryPrefs);
  const setDeliveryPref = useSettingsStore((s) => s.setDeliveryPref);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 48, gap: 20 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>Delivery preferences</Text>
      </View>

      <GlassView radius="card" style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
        <SettingsRow
          icon={Package}
          iconColor={colors.partner.orange}
          iconBg={colors.partner.orangeTint}
          label="Auto-accept jobs"
          description="Matching jobs are accepted for you automatically"
          right={
            <Switch
              value={deliveryPrefs.autoAccept}
              onValueChange={(value) => setDeliveryPref('autoAccept', value)}
              trackColor={{ false: theme.border, true: colors.partner.orangeTint }}
              thumbColor={deliveryPrefs.autoAccept ? colors.partner.orange : theme.surfaceRaised}
            />
          }
        />
      </GlassView>

      <View style={{ gap: 8 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8, marginLeft: 4 }}>
          DISTANCE
        </Text>
        <GlassView radius="card" style={{ padding: 18, gap: 16 }}>
          <Stepper
            label="Preferred delivery radius"
            description="Jobs closer than this are prioritized first"
            value={deliveryPrefs.radiusKm}
            min={RADIUS_MIN}
            max={deliveryPrefs.maxDistanceKm}
            unit="km"
            onChange={(v) => setDeliveryPref('radiusKm', v)}
            theme={theme}
          />
          <View style={{ height: 1, backgroundColor: theme.border }} />
          <Stepper
            label="Maximum delivery distance"
            description="Jobs farther than this won't be shown to you"
            value={deliveryPrefs.maxDistanceKm}
            min={Math.max(deliveryPrefs.radiusKm, DISTANCE_MIN)}
            max={DISTANCE_MAX}
            unit="km"
            onChange={(v) => setDeliveryPref('maxDistanceKm', v)}
            theme={theme}
          />
        </GlassView>
      </View>

      <View style={{ gap: 8 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8, marginLeft: 4 }}>
          DELIVERY CATEGORIES
        </Text>
        <GlassView radius="card" style={{ padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Soup size={20} color={colors.partner.orange} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text className="text-body-lg font-medium" style={{ color: theme.text }}>Food deliveries</Text>
            <Text className="text-caption" style={{ color: theme.textSecondary }}>
              You're offered food orders only. Marketplace and laundry orders are handled by Fastermall.
            </Text>
          </View>
        </GlassView>
      </View>

      <View style={{ gap: 8 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8, marginLeft: 4 }}>
          WORK
        </Text>
        <GlassView radius="card" style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
          <SettingsRow
            icon={partner.isAvailable ? Check : Package}
            iconColor={partner.isAvailable ? colors.semantic.success : theme.textSecondary}
            iconBg={partner.isAvailable ? 'rgba(26, 156, 92, 0.14)' : theme.surfaceRaised}
            label="Online — receiving jobs"
            description={partner.isAvailable ? 'You are currently online' : 'You are currently offline'}
            right={
              <Switch
                value={partner.isAvailable}
                onValueChange={partner.setAvailable}
                trackColor={{ false: theme.border, true: colors.partner.orangeTint }}
                thumbColor={partner.isAvailable ? colors.partner.orange : theme.surfaceRaised}
              />
            }
          />
          <View style={{ height: 1, backgroundColor: theme.border, marginLeft: 46 }} />
          <SettingsRow
            icon={Bike}
            iconColor={colors.partner.orange}
            iconBg={colors.partner.orangeTint}
            label="Vehicle type"
            description={`${partner.mode === 'MOTORCYCLE' ? 'Motorcycle' : 'Walking'}${partner.vehiclePlate ? ` \u00b7 ${partner.vehiclePlate}` : ''}`}
            onPress={() => router.push('/profile')}
          />
        </GlassView>
      </View>
    </ScrollView>
  );
}

function Stepper({
  label,
  description,
  value,
  min,
  max,
  unit,
  onChange,
  theme,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
  theme: { text: string; textSecondary: string; border: string };
}) {
  return (
    <View style={{ gap: 10 }}>
      <View>
        <Text className="text-body-lg font-medium" style={{ color: theme.text }}>{label}</Text>
        <Text className="text-caption" style={{ color: theme.textSecondary }}>{description}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <AnimatedPressable
          onPress={() => onChange(Math.max(min, value - 1))}
          scaleTo={0.9}
          disabled={value <= min}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: theme.border,
              opacity: value <= min ? 0.4 : 1,
            }}
          >
            <Minus size={16} color={theme.text} />
          </View>
        </AnimatedPressable>
        <Text className="text-h2 font-bold" style={{ color: theme.text, minWidth: 64, textAlign: 'center' }}>
          {value} {unit}
        </Text>
        <AnimatedPressable
          onPress={() => onChange(Math.min(max, value + 1))}
          scaleTo={0.9}
          disabled={value >= max}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: theme.border,
              opacity: value >= max ? 0.4 : 1,
            }}
          >
            <Plus size={16} color={theme.text} />
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}
