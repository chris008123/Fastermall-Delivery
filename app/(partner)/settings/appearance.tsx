import { Check, Power, Smartphone, Moon, Sun, Vibrate } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { AppSwitch } from '@/src/shared/components/AppSwitch';
import { BackButton } from '@/src/shared/components/BackButton';
import { GlassView } from '@/src/shared/components/GlassView';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useScreenBottomPadding } from '@/src/shared/hooks/useScreenBottomPadding';
import { useInteractionStore } from '@/src/stores/interactionStore';
import { useNavStyleStore, type NavAlign, type NavStyle } from '@/src/stores/navStyleStore';
import { useSettingsStore, type ThemeMode } from '@/src/stores/settingsStore';
import { colors } from '@/src/theme';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Smartphone },
];

const NAV_OPTIONS: { value: NavStyle; label: string; description: string }[] = [
  { value: 'floating', label: 'Floating', description: 'The frosted bar that sits over the screen.' },
  { value: 'docked', label: 'Docked', description: 'A full-width bar with labels at the bottom.' },
  { value: 'compact', label: 'Compact', description: 'Icons only, in a slimmer bar. Leaves more room.' },
];

type Theme = typeof colors.light | typeof colors.dark;

const ALIGN_OPTIONS: { value: NavAlign; label: string }[] = [
  { value: 'start', label: 'Left' },
  { value: 'center', label: 'Centre' },
  { value: 'end', label: 'Right' },
];

/** A tiny schematic of the screen with the nav drawn in the chosen style. */
function NavPreview({ style, align, theme }: { style: NavStyle; align: NavAlign; theme: Theme }) {
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
        <View
          style={{
            alignItems: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center',
            paddingBottom: 6,
            paddingHorizontal: align === 'center' ? 0 : 5,
          }}
        >
          <View
            style={{
              height: 16,
              paddingHorizontal: 7,
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

/** A tiny phone screen drawn in the theme it stands for. "System" is split
 * down the middle, light on the left and dark on the right. */
function ThemeSwatch({ mode }: { mode: ThemeMode }) {
  const half = (t: Theme) => (
    <View style={{ flex: 1, backgroundColor: t.background, padding: 6, gap: 4 }}>
      <View style={{ height: 5, width: '60%', borderRadius: 3, backgroundColor: t.text, opacity: 0.85 }} />
      <View style={{ height: 14, borderRadius: 4, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }} />
      <View style={{ height: 14, borderRadius: 4, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }} />
      <View style={{ height: 4, width: '40%', borderRadius: 2, backgroundColor: colors.partner.orange }} />
    </View>
  );
  return (
    <View
      style={{
        height: 64,
        alignSelf: 'stretch',
        borderRadius: 10,
        overflow: 'hidden',
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: 'rgba(128, 120, 110, 0.35)',
      }}
    >
      {mode === 'dark' ? half(colors.dark) : half(colors.light)}
      {mode === 'system' ? half(colors.dark) : null}
    </View>
  );
}

/** Equal-width segments in one track. Each segment is wrapped in a plain
 * View that carries flex: 1 — AnimatedPressable drops layout styles (see
 * its doc comment), which is what squeezed the old pills to their text. */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  theme,
  isDark,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  theme: Theme;
  isDark: boolean;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      style={{
        flexDirection: 'row',
        padding: 4,
        gap: 4,
        borderRadius: 999,
        backgroundColor: isDark ? 'rgba(247, 243, 236, 0.06)' : 'rgba(28, 26, 22, 0.05)',
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <View key={o.value} style={{ flex: 1 }}>
            <AnimatedPressable
              onPress={() => onChange(o.value)}
              scaleTo={0.96}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={o.label}
            >
              <View
                style={{
                  height: 40,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? colors.partner.orange : 'transparent',
                }}
              >
                <Text
                  className="text-body font-semibold"
                  numberOfLines={1}
                  style={{ color: active ? '#ffffff' : theme.textSecondary }}
                >
                  {o.label}
                </Text>
              </View>
            </AnimatedPressable>
          </View>
        );
      })}
    </View>
  );
}

export default function AppearanceScreen() {
  const insets = useSafeAreaInsets();
  const bottomPadding = useScreenBottomPadding(40);
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

  const sectionTitle = (title: string) => (
    <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8, marginLeft: 4, marginTop: 4 }}>
      {title}
    </Text>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: bottomPadding, gap: 12 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>Appearance</Text>
      </View>

      {sectionTitle('THEME')}
      <GlassView radius="card" style={{ padding: 14, gap: 12 }}>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 10 }}>
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = currentTheme === value;
            const tint = active ? colors.partner.orange : theme.textSecondary;
            return (
              // Plain View carries the flex so all three tiles are the same width.
              <View key={value} style={{ flex: 1 }}>
                <AnimatedPressable
                  onPress={() => setTheme(value)}
                  scaleTo={0.97}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${label} theme`}
                >
                  <View
                    style={{
                      alignItems: 'center',
                      gap: 10,
                      padding: 8,
                      paddingBottom: 12,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: active ? colors.partner.orange : theme.border,
                      backgroundColor: active ? colors.partner.orangeTint : 'transparent',
                    }}
                  >
                    <ThemeSwatch mode={value} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Icon size={15} color={tint} />
                      <Text className="text-caption font-semibold" numberOfLines={1} style={{ color: active ? colors.partner.orange : theme.text }}>
                        {label}
                      </Text>
                    </View>
                    {active && (
                      <View
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: colors.partner.orange,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={12} color="#ffffff" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                </AnimatedPressable>
              </View>
            );
          })}
        </View>
        <Text className="text-caption" style={{ color: theme.textSecondary, paddingHorizontal: 4 }}>
          {currentTheme === 'system'
            ? "Follows your phone's light or dark setting."
            : `Always ${currentTheme}, whatever your phone is set to.`}
        </Text>
      </GlassView>

      {sectionTitle('NAVIGATION BAR')}
      <GlassView radius="card" style={{ padding: 14, gap: 10 }}>
        {NAV_OPTIONS.map((option) => {
          const active = navStyle === option.value;
          return (
            <AnimatedPressable
              key={option.value}
              onPress={() => setNavStyle(option.value)}
              scaleTo={0.98}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${option.label}. ${option.description}`}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 10,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: active ? colors.partner.orange : theme.border,
                  backgroundColor: active ? colors.partner.orangeTint : 'transparent',
                }}
              >
                <NavPreview style={option.value} align={navAlign} theme={theme} />
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
                    borderColor: active ? colors.partner.orange : theme.textSecondary,
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
          <View style={{ gap: 8, marginTop: 6 }}>
            <Text className="text-caption font-semibold" style={{ color: theme.text, marginLeft: 4 }}>Bar position</Text>
            <Segmented options={ALIGN_OPTIONS} value={navAlign} onChange={setNavAlign} theme={theme} isDark={isDark} />
            <Text className="text-caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
              Move it under the thumb you ride with.
            </Text>
          </View>
        )}
      </GlassView>

      {sectionTitle('CONTROLS')}
      <GlassView radius="card" style={{ padding: 16, gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Vibrate size={20} color={theme.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text className="text-body-lg font-medium" style={{ color: theme.text }}>Vibration feedback</Text>
            <Text className="text-caption" style={{ color: theme.textSecondary }}>
              A small buzz when you go online, accept a job or switch tabs.
            </Text>
          </View>
          <AppSwitch accessibilityLabel="Vibration feedback" value={hapticsEnabled} onValueChange={setHapticsEnabled} />
        </View>
        <View style={{ height: 1, backgroundColor: theme.border }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Power size={20} color={theme.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text className="text-body-lg font-medium" style={{ color: theme.text }}>Go offline with a tap</Text>
            <Text className="text-caption" style={{ color: theme.textSecondary }}>
              Going online always takes a slide, so it can't happen by accident.
            </Text>
          </View>
          <AppSwitch accessibilityLabel="Go offline with a tap" value={offlineByTap} onValueChange={setOfflineByTap} />
        </View>
      </GlassView>

      <Text className="text-caption" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 4 }}>
        Saved on this phone.
      </Text>
    </ScrollView>
  );
}
