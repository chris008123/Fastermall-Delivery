import { Laptop, Moon, Power, Sun, Vibrate } from 'lucide-react-native';
import { ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { BackButton } from '@/src/shared/components/BackButton';
import { GlassView } from '@/src/shared/components/GlassView';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useInteractionStore } from '@/src/stores/interactionStore';
import { useNavStyleStore, type NavAlign, type NavStyle } from '@/src/stores/navStyleStore';
import { useSettingsStore, type ThemeMode } from '@/src/stores/settingsStore';
import { colors } from '@/src/theme';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Laptop },
];

const NAV_OPTIONS: { value: NavStyle; label: string; description: string }[] = [
  { value: 'floating', label: 'Floating', description: 'The frosted bar that sits over the screen.' },
  { value: 'docked', label: 'Docked', description: 'A full-width bar with labels at the bottom.' },
  { value: 'compact', label: 'Compact', description: 'Icons only, in a slimmer bar. Leaves more room.' },
];

const ALIGN_OPTIONS: { value: NavAlign; label: string }[] = [
  { value: 'start', label: 'Left' },
  { value: 'center', label: 'Centre' },
  { value: 'end', label: 'Right' },
];

/** A tiny schematic of the screen with the nav drawn in the chosen style. */
function NavPreview({ style, theme }: { style: NavStyle; theme: typeof colors.light | typeof colors.dark }) {
  const dots = (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: i === 0 ? colors.partner.orange : theme.borderStrong,
          }}
        />
      ))}
    </View>
  );

  return (
    <View
      style={{
        width: 88,
        height: 64,
        borderRadius: 12,
        backgroundColor: theme.background,
        overflow: 'hidden',
        justifyContent: 'flex-end',
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      {style === 'floating' ? (
        <View style={{ alignItems: 'center', paddingBottom: 6 }}>
          <View
            style={{
              height: 16,
              paddingHorizontal: 10,
              borderRadius: 8,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.borderStrong,
              justifyContent: 'center',
            }}
          >
            {dots}
          </View>
        </View>
      ) : (
        <View
          style={{
            height: style === 'docked' ? 18 : 12,
            backgroundColor: theme.surface,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {dots}
        </View>
      )}
    </View>
  );
}

// Theme picker is unchanged from the original screen; below it are the
// navigation-bar and controls options added alongside it.
export default function AppearanceScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const currentTheme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const navStyle = useNavStyleStore((s) => s.navStyle);
  const setNavStyle = useNavStyleStore((s) => s.setNavStyle);
  const navAlign = useNavStyleStore((s) => s.navAlign);
  const setNavAlign = useNavStyleStore((s) => s.setNavAlign);

  const hapticsEnabled = useInteractionStore((s) => s.hapticsEnabled);
  const setHapticsEnabled = useInteractionStore((s) => s.setHapticsEnabled);
  const offlineByTap = useInteractionStore((s) => s.offlineByTap);
  const setOfflineByTap = useInteractionStore((s) => s.setOfflineByTap);

  const switchColors = { false: theme.borderStrong, true: colors.partner.orange };

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

      <Text className="text-card-title font-semibold" style={{ color: theme.text, marginTop: 4 }}>
        Navigation bar
      </Text>
      <GlassView radius="card" style={{ padding: 18, gap: 12 }}>
        {NAV_OPTIONS.map((option) => {
          const active = navStyle === option.value;
          return (
            <AnimatedPressable key={option.value} onPress={() => setNavStyle(option.value)} scaleTo={0.98}>
              <View
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${option.label}. ${option.description}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 12,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: active ? colors.partner.orange : theme.border,
                  backgroundColor: active ? colors.partner.orangeTint : 'transparent',
                }}
              >
                <NavPreview style={option.value} theme={theme} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text className="text-body-lg font-semibold" style={{ color: theme.text }}>{option.label}</Text>
                  <Text className="text-caption" style={{ color: theme.textSecondary }}>{option.description}</Text>
                </View>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: active ? colors.partner.orange : theme.borderStrong,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {active ? (
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.partner.orange }} />
                  ) : null}
                </View>
              </View>
            </AnimatedPressable>
          );
        })}

        {navStyle === 'floating' && (
          <View style={{ gap: 8, marginTop: 4 }}>
            <Text className="text-caption font-medium" style={{ color: theme.textSecondary }}>Position</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {ALIGN_OPTIONS.map(({ value, label }) => {
                const active = navAlign === value;
                return (
                  <AnimatedPressable key={value} onPress={() => setNavAlign(value)} scaleTo={0.97} style={{ flex: 1 }}>
                    <View
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={label}
                      style={{
                        alignItems: 'center',
                        paddingVertical: 12,
                        borderRadius: 16,
                        borderWidth: 1.5,
                        borderColor: active ? colors.partner.orange : theme.border,
                        backgroundColor: active ? colors.partner.orangeTint : 'transparent',
                      }}
                    >
                      <Text
                        className="text-caption font-semibold"
                        style={{ color: active ? colors.partner.orange : theme.textSecondary }}
                      >
                        {label}
                      </Text>
                    </View>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>
        )}

        <Text className="text-caption" style={{ color: theme.textSecondary }}>
          Your choices are saved on this device.
        </Text>
      </GlassView>

      <Text className="text-card-title font-semibold" style={{ color: theme.text, marginTop: 4 }}>
        Controls
      </Text>
      <GlassView radius="card" style={{ padding: 18, gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Vibrate size={20} color={theme.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text className="text-body-lg font-medium" style={{ color: theme.text }}>Vibration feedback</Text>
            <Text className="text-caption" style={{ color: theme.textSecondary }}>
              A small buzz when you go online, accept a job or switch tabs.
            </Text>
          </View>
          <Switch value={hapticsEnabled} onValueChange={setHapticsEnabled} trackColor={switchColors} thumbColor="#ffffff" />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Power size={20} color={theme.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text className="text-body-lg font-medium" style={{ color: theme.text }}>Go offline with a tap</Text>
            <Text className="text-caption" style={{ color: theme.textSecondary }}>
              Going online always takes a slide, so it can't happen by accident.
            </Text>
          </View>
          <Switch value={offlineByTap} onValueChange={setOfflineByTap} trackColor={switchColors} thumbColor="#ffffff" />
        </View>
      </GlassView>
    </ScrollView>
  );
}
