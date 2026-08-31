import { Laptop, Moon, Sun } from 'lucide-react-native';
import { Text, View } from 'react-native';
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

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const currentTheme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: insets.top + 16, paddingHorizontal: 20, gap: 16 }}>
      {/* This screen is pushed on top of the headerless (partner) Stack
          (screenOptions sets headerShown: false for every route so the
          tab roots stay clean under the floating nav), which left
          Settings with no visible way back — only an OS swipe/hardware
          gesture. BackButton is the shared fix, also used on the job
          detail and active delivery screens. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>Settings</Text>
      </View>

      <GlassView radius="card" style={{ padding: 18, gap: 12 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8 }}>
          APPEARANCE
        </Text>
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
    </View>
  );
}
