import { Laptop, Moon, Power, Sun, Vibrate } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radii } from '@/src/ds/tokens';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import { useInteractionStore } from '@/src/stores/interactionStore';
import { useNavStyleStore, type NavAlign, type NavStyle } from '@/src/stores/navStyleStore';
import { useSettingsStore, type ThemeMode } from '@/src/stores/settingsStore';
import { Group, ListRow } from '@/src/ui/List';
import { ScreenHeader } from '@/src/ui/ScreenHeader';
import { Segmented } from '@/src/ui/Segmented';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: ComponentType<{ size?: number; color?: string }> }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Laptop },
];

const NAV_OPTIONS: { value: NavStyle; label: string; description: string }[] = [
  { value: 'docked', label: 'Docked', description: 'Full-width bar with labels. The easiest to read at a glance.' },
  { value: 'compact', label: 'Compact', description: 'Icons only, in a slimmer bar. Leaves more room for content.' },
  { value: 'floating', label: 'Floating', description: 'A detached bar that sits over the screen.' },
];

const ALIGN_OPTIONS: { value: NavAlign; label: string }[] = [
  { value: 'start', label: 'Left' },
  { value: 'center', label: 'Centre' },
  { value: 'end', label: 'Right' },
];

/** A tiny schematic of the screen with the nav drawn in the chosen style. */
function NavPreview({ style }: { style: NavStyle }) {
  const { t } = useTheme();
  const dots = (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: i === 0 ? t.primary : t.lineStrong }}
        />
      ))}
    </View>
  );

  return (
    <View
      style={{
        width: 88,
        height: 64,
        borderRadius: radii.sm,
        backgroundColor: t.sunken,
        overflow: 'hidden',
        justifyContent: 'flex-end',
      }}
    >
      {style === 'floating' ? (
        <View style={{ alignItems: 'center', paddingBottom: 6 }}>
          <View
            style={{
              height: 16,
              paddingHorizontal: 10,
              borderRadius: 8,
              backgroundColor: t.surface,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: t.lineStrong,
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
            backgroundColor: t.surface,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: t.line,
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

export default function AppearanceScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTheme();
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

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader title="Appearance" back />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32, gap: 28 }}>
        <View style={{ gap: 10 }}>
          <Txt variant="heading">Theme</Txt>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = currentTheme === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setTheme(value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={label}
                  style={{ flex: 1 }}
                >
                  <View
                    style={{
                      alignItems: 'center',
                      gap: 8,
                      paddingVertical: 16,
                      borderRadius: radii.md,
                      borderWidth: 2,
                      borderColor: active ? t.primary : t.line,
                      backgroundColor: active ? t.primaryTint : t.surface,
                    }}
                  >
                    <Icon size={22} color={active ? t.primary : t.inkSecondary} />
                    <Txt variant="label" tone={active ? 'primary' : 'secondary'}>
                      {label}
                    </Txt>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Txt variant="caption" tone="secondary">
            {currentTheme === 'system'
              ? "Follows your device's appearance setting."
              : `Always uses ${currentTheme} mode, whatever your device is set to.`}
          </Txt>
        </View>

        <View style={{ gap: 10 }}>
          <Txt variant="heading">Navigation bar</Txt>
          <View style={{ gap: 10 }}>
            {NAV_OPTIONS.map((option) => {
              const active = navStyle === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setNavStyle(option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${option.label}. ${option.description}`}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                      padding: 12,
                      borderRadius: radii.md,
                      borderWidth: 2,
                      borderColor: active ? t.primary : t.line,
                      backgroundColor: t.surface,
                    }}
                  >
                    <NavPreview style={option.value} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Txt variant="bodyStrong">{option.label}</Txt>
                      <Txt variant="caption" tone="secondary">
                        {option.description}
                      </Txt>
                    </View>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: active ? t.primary : t.lineStrong,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {active ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.primary }} /> : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {navStyle === 'floating' ? (
            <View style={{ gap: 6 }}>
              <Txt variant="label" tone="secondary">
                Position
              </Txt>
              <Segmented options={ALIGN_OPTIONS} value={navAlign} onChange={setNavAlign} accessibilityLabel="Floating bar position" />
            </View>
          ) : null}
          <Txt variant="caption" tone="secondary">
            Your choices are saved on this device.
          </Txt>
        </View>

        <Group title="Controls">
          <ListRow
            icon={Vibrate}
            label="Vibration feedback"
            description="A small buzz when you go online, accept a job or switch tabs."
            right={
              <Switch
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
                trackColor={{ false: t.lineStrong, true: t.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <ListRow
            icon={Power}
            label="Go offline with a tap"
            description="Going online always takes a slide, so it can't happen by accident."
            right={
              <Switch
                value={offlineByTap}
                onValueChange={setOfflineByTap}
                trackColor={{ false: t.lineStrong, true: t.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </Group>
      </ScrollView>
    </View>
  );
}
