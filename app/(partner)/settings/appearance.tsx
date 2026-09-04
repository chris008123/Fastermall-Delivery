import { Laptop, Moon, Sun } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { BackButton } from '@/src/shared/components/BackButton';
import { GlassView } from '@/src/shared/components/GlassView';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useSettingsStore, type ThemeMode } from '@/src/stores/settingsStore';
import { colors } from '@/src/theme';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Laptop },
];

// Split out of the old single-card Settings screen into its own route —
// same picker UI as before, just relocated so the hub stays a plain list.
export default function AppearanceScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const currentTheme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 48, gap: 16 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>Appearance</Text>
      </View>

      <GlassView radius="card" style={{ padding: 18, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = currentTheme === value;
            return (
              <AnimatedPressable key={value} onPress={() => setTheme(value)} scaleTo={0.97} style={{ flex: 1 }}>
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 14,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: active ? colors.partner.orange : theme.border,
                    backgroundColor: active ? colors.partner.orangeTint : 'transparent',
                  }}
                >
                  <Icon size={20} color={active ? colors.partner.orange : theme.textSecondary} />
                  <Text className="text-caption font-semibold" style={{ color: active ? colors.partner.orange : theme.textSecondary }}>
                    {label}
                  </Text>
                </View>
              </AnimatedPressable>
            );
          })}
        </View>
        <Text className="text-caption" style={{ color: theme.textSecondary }}>
          {currentTheme === 'system'
            ? "Follows your device's appearance setting."
            : `Always uses ${currentTheme} mode, regardless of your device setting.`}
        </Text>
      </GlassView>
    </ScrollView>
  );
}
