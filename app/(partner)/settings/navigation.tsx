import { Bike, Check, MapPinned, Navigation as NavigationIcon } from 'lucide-react-native';
import { ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { BackButton } from '@/src/shared/components/BackButton';
import { GlassView } from '@/src/shared/components/GlassView';
import { SettingsRow, SettingsRowDivider } from '@/src/shared/components/SettingsRow';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useSettingsStore, type NavigationApp, type NavigationPrefs } from '@/src/stores/settingsStore';
import { colors } from '@/src/theme';

const NAV_APP_OPTIONS: { value: NavigationApp; label: string; description: string; icon: typeof MapPinned }[] = [
  { value: 'FASTERMALL_MAPS', label: 'Fastermall Maps', description: 'Built-in map, shown right on the delivery screen', icon: MapPinned },
  { value: 'GOOGLE_MAPS', label: 'Google Maps', description: 'Opens turn-by-turn in Google Maps', icon: NavigationIcon },
  { value: 'WAZE', label: 'Waze', description: 'Opens turn-by-turn in Waze', icon: Bike },
];

const ROUTE_TOGGLES: { key: keyof NavigationPrefs; label: string; description: string }[] = [
  { key: 'avoidTolls', label: 'Avoid toll roads', description: 'Route around tolls when possible' },
  { key: 'avoidHighways', label: 'Avoid highways', description: 'Prefer surface streets' },
  { key: 'voiceNavigation', label: 'Voice navigation', description: 'Spoken turn-by-turn directions' },
  { key: 'autoOpenNavigation', label: 'Open navigation automatically', description: 'Launch directions as soon as a job is accepted' },
];

export default function NavigationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const navigationApp = useSettingsStore((s) => s.navigationApp);
  const setNavigationApp = useSettingsStore((s) => s.setNavigationApp);
  const navigationPrefs = useSettingsStore((s) => s.navigationPrefs);
  const setNavigationPref = useSettingsStore((s) => s.setNavigationPref);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 48, gap: 16 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>Navigation</Text>
      </View>

      <GlassView radius="card" style={{ padding: 18, gap: 12 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8 }}>
          MAP APP
        </Text>
        <View style={{ gap: 8 }}>
          {NAV_APP_OPTIONS.map(({ value, label, description, icon: Icon }) => {
            const active = navigationApp === value;
            return (
              <AnimatedPressable key={value} onPress={() => setNavigationApp(value)} scaleTo={0.98}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: active ? colors.partner.orange : theme.border,
                    backgroundColor: active ? colors.partner.orangeTint : 'transparent',
                  }}
                >
                  <Icon size={20} color={active ? colors.partner.orange : theme.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <Text
                      className="text-body-lg font-semibold"
                      style={{ color: active ? colors.partner.orange : theme.text }}
                    >
                      {label}
                    </Text>
                    <Text className="text-caption" style={{ color: theme.textSecondary }}>{description}</Text>
                  </View>
                  {active && <Check size={18} color={colors.partner.orange} />}
                </View>
              </AnimatedPressable>
            );
          })}
        </View>
        <Text className="text-caption" style={{ color: theme.textSecondary }}>
          Applies to the Navigate button during an active delivery.
        </Text>
      </GlassView>

      <View style={{ gap: 8 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8, marginLeft: 4 }}>
          ROUTE PREFERENCES
        </Text>
        <GlassView radius="card" style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
          {ROUTE_TOGGLES.map(({ key, label, description }, i) => (
            <View key={key}>
              <SettingsRow
                icon={NavigationIcon}
                iconColor={colors.accent.blue}
                iconBg="rgba(59, 130, 196, 0.14)"
                label={label}
                description={description}
                right={
                  <Switch
                    value={navigationPrefs[key]}
                    onValueChange={(value) => setNavigationPref(key, value)}
                    trackColor={{ false: theme.border, true: colors.partner.orangeTint }}
                    thumbColor={navigationPrefs[key] ? colors.partner.orange : theme.surfaceRaised}
                  />
                }
              />
              {i < ROUTE_TOGGLES.length - 1 && <SettingsRowDivider />}
            </View>
          ))}
        </GlassView>
        {/* Only Fastermall Maps' own route respects avoid-tolls / avoid-highways
            today — Google Maps and Waze apply their own in-app settings once
            handed off. Noted inline rather than disabling the toggles, since
            they're still meaningful defaults if the partner later switches
            back to Fastermall Maps. */}
        {navigationApp !== 'FASTERMALL_MAPS' && (
          <Text className="text-caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
            Route preferences apply to Fastermall Maps. {NAV_APP_OPTIONS.find((o) => o.value === navigationApp)?.label} uses its own in-app settings.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
