import { Bike, Check, Navigation as NavigationIcon } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { BackButton } from '@/src/shared/components/BackButton';
import { GlassView } from '@/src/shared/components/GlassView';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useSettingsStore, type NavigationApp } from '@/src/stores/settingsStore';
import { colors } from '@/src/theme';

const NAV_APP_OPTIONS: { value: NavigationApp; label: string; description: string; icon: typeof Bike }[] = [
  { value: 'GOOGLE_MAPS', label: 'Google Maps', description: 'Opens turn-by-turn in Google Maps', icon: NavigationIcon },
  { value: 'WAZE', label: 'Waze', description: 'Opens turn-by-turn in Waze', icon: Bike },
];

export default function NavigationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const navigationApp = useSettingsStore((s) => s.navigationApp);
  const setNavigationApp = useSettingsStore((s) => s.setNavigationApp);

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
          Applies to the Navigate button during an active delivery. Route options such as avoiding tolls are set in that app.
        </Text>
      </GlassView>

    </ScrollView>
  );
}
