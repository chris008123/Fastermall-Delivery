import { useRouter, useSegments } from 'expo-router';
import { Bell, Home, Package, User, Wallet } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from './GlassView';
import { AnimatedPressable } from './AnimatedPressable';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';
import { selectUnreadCount, useNotificationsStore } from '@/src/stores/notificationsStore';

type NavKey = 'home' | 'jobs' | 'wallet' | 'notifications' | 'profile';

const items: { key: NavKey; href: string; icon: typeof Home; label: string }[] = [
  { key: 'home', href: '/(partner)', icon: Home, label: 'Home' },
  { key: 'jobs', href: '/(partner)/jobs', icon: Package, label: 'Jobs' },
  { key: 'wallet', href: '/(partner)/wallet', icon: Wallet, label: 'Wallet' },
  { key: 'notifications', href: '/(partner)/notifications', icon: Bell, label: 'Alerts' },
  { key: 'profile', href: '/(partner)/profile', icon: User, label: 'Profile' },
];

// Ported from the customer app's FloatingNav, adapted for the partner app's
// flatter route structure: no nested (home)-style route group, so the home
// screen is segments.length === 1 ['(partner)'] rather than length 2.
// Only section-root screens show the nav; job detail, active delivery, and
// settings are task-focused and hide it, same "home base tabs only"
// convention as the customer app.
const SEGMENT_MAP: Record<string, NavKey> = {
  jobs: 'jobs',
  wallet: 'wallet',
  notifications: 'notifications',
  profile: 'profile',
};

export function FloatingNav() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const notifications = useNotificationsStore((s) => s.notifications);
  const unreadCount = selectUnreadCount(notifications);

  if (segments[0] !== '(partner)') return null;

  let activeSection: NavKey | undefined;
  if (segments.length === 1) {
    activeSection = 'home';
  } else if (segments.length === 2) {
    activeSection = SEGMENT_MAP[segments[1] as string];
  }
  if (!activeSection) return null;

  const inactiveColor = isDark ? colors.dark.textSecondary : colors.light.textSecondary;
  // The partner app's own identity color, not any single job-type color —
  // this chrome belongs to the partner, not to a marketplace/food/laundry
  // job, matching the `partner` Button variant and tab bar convention.
  const activeColor = isDark ? colors.partner.orangeBright : colors.partner.orange;
  const activeBackground = isDark ? 'rgba(242, 149, 79, 0.18)' : colors.partner.orangeTint;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 12, alignItems: 'center' }}
    >
      <GlassView radius="pill" intensity="strong">
        <View className="flex-row items-center gap-4 px-4 py-3">
          {items.map((item) => {
            const active = item.key === activeSection;
            const Icon = item.icon;
            return (
              <View key={item.key} style={{ minWidth: 52, alignItems: 'center' }}>
                <AnimatedPressable
                  onPress={() => router.push(item.href as never)}
                  scaleTo={0.9}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <View style={{ alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: active ? activeBackground : 'transparent',
                      }}
                    >
                      <Icon size={20} color={active ? activeColor : inactiveColor} />
                      {item.key === 'notifications' && unreadCount > 0 && (
                        <View
                          style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: colors.semantic.error,
                          }}
                        />
                      )}
                    </View>
                    <Text
                      className="text-caption font-medium"
                      style={{ color: active ? activeColor : inactiveColor, fontSize: 11, textAlign: 'center' }}
                    >
                      {item.label}
                    </Text>
                  </View>
                </AnimatedPressable>
              </View>
            );
          })}
        </View>
      </GlassView>
    </View>
  );
}
