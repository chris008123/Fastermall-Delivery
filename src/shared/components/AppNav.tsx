import { useRouter, useSegments } from 'expo-router';
import { Bell, Home, Package, User, Wallet } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/src/shared/utils/haptics';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useNavStyleStore, type NavStyle } from '@/src/stores/navStyleStore';
import { selectUnreadCount, useNotificationsStore } from '@/src/stores/notificationsStore';
import { colors } from '@/src/theme';
import { AnimatedPressable } from './AnimatedPressable';
import { GlassView } from './GlassView';

type NavKey = 'home' | 'jobs' | 'wallet' | 'notifications' | 'profile';

const items: { key: NavKey; href: string; icon: typeof Home; label: string }[] = [
  { key: 'home', href: '/(partner)', icon: Home, label: 'Home' },
  { key: 'jobs', href: '/(partner)/jobs', icon: Package, label: 'Jobs' },
  { key: 'wallet', href: '/(partner)/wallet', icon: Wallet, label: 'Wallet' },
  { key: 'notifications', href: '/(partner)/notifications', icon: Bell, label: 'Alerts' },
  { key: 'profile', href: '/(partner)/profile', icon: User, label: 'Profile' },
];

// Only section roots show the nav; job detail, active delivery and settings
// are task-focused and hide it (same rule as the original floating nav).
const SEGMENT_MAP: Record<string, NavKey> = {
  jobs: 'jobs',
  wallet: 'wallet',
  notifications: 'notifications',
  profile: 'profile',
};

// `height` excludes the bottom safe-area inset; `offset` is the gap under
// the floating bar. The floating numbers match the original floating pill.
const GEOMETRY: Record<NavStyle, { height: number; offset: number }> = {
  floating: { height: 76, offset: 12 },
  docked: { height: 62, offset: 0 },
  compact: { height: 52, offset: 0 },
};

/** Bottom padding a screen needs so its content clears the nav, whichever
 * style the partner picked. Includes the safe-area inset. */
export function useNavClearance() {
  const insets = useSafeAreaInsets();
  const navStyle = useNavStyleStore((s) => s.navStyle);
  const g = GEOMETRY[navStyle];
  return insets.bottom + g.offset + g.height + 16;
}

/**
 * The partner app's bottom navigation, with three styles the partner picks
 * in Settings > Appearance: floating (the original frosted pill, still the
 * default), docked (a full-width bar with labels) and compact (docked,
 * icons only). All three use the same orange active color.
 */
export function AppNav() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const navStyle = useNavStyleStore((s) => s.navStyle);
  const navAlign = useNavStyleStore((s) => s.navAlign);
  const notifications = useNotificationsStore((s) => s.notifications);
  const unreadCount = selectUnreadCount(notifications);

  const segs = segments as string[];
  if (segs[0] !== '(partner)') return null;

  let activeSection: NavKey | undefined;
  if (segs.length === 1) {
    activeSection = 'home';
  } else if (segs.length === 2) {
    activeSection = SEGMENT_MAP[segs[1]];
  }
  if (!activeSection) return null;

  const theme = isDark ? colors.dark : colors.light;
  const inactiveColor = theme.textSecondary;
  const activeColor = isDark ? colors.partner.orangeBright : colors.partner.orange;
  const showLabel = navStyle !== 'compact';
  const g = GEOMETRY[navStyle];

  const renderItem = (item: (typeof items)[number]) => {
    const active = item.key === activeSection;
    const Icon = item.icon;
    const color = active ? activeColor : inactiveColor;

    const icon = (
      <View>
        <Icon size={navStyle === 'compact' ? 24 : 22} color={color} />
        {item.key === 'notifications' && unreadCount > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -2,
              right: -4,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.semantic.error,
            }}
          />
        )}
      </View>
    );

    const label = showLabel ? (
      <Text className="text-caption font-medium" style={{ color, fontSize: 11, textAlign: 'center' }}>
        {item.label}
      </Text>
    ) : null;

    let content;
    if (navStyle === 'floating') {
      content = (
        <View style={{ alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          {icon}
          {label}
        </View>
      );
    } else if (navStyle === 'docked') {
      content = (
        <View style={{ height: g.height, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          {active && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                width: 28,
                height: 3,
                borderBottomLeftRadius: 2,
                borderBottomRightRadius: 2,
                backgroundColor: activeColor,
              }}
            />
          )}
          {icon}
          {label}
        </View>
      );
    } else {
      content = (
        <View style={{ height: g.height, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              width: 52,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? colors.partner.orangeTint : 'transparent',
            }}
          >
            {icon}
          </View>
        </View>
      );
    }

    return (
      <View key={item.key} style={navStyle === 'floating' ? { minWidth: 52, alignItems: 'center' } : { flex: 1 }}>
        <AnimatedPressable
          onPress={() => {
            if (item.key !== activeSection) haptics.select();
            router.push(item.href as never);
          }}
          scaleTo={navStyle === 'floating' ? 0.9 : 0.94}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: active }}
        >
          {content}
        </AnimatedPressable>
      </View>
    );
  };

  if (navStyle === 'floating') {
    return (
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: insets.bottom + g.offset,
          paddingHorizontal: navAlign === 'center' ? 0 : 16,
          alignItems: navAlign === 'start' ? 'flex-start' : navAlign === 'end' ? 'flex-end' : 'center',
        }}
      >
        <GlassView radius="pill" intensity="strong">
          <View className="flex-row items-center gap-4 px-4 py-3">{items.map(renderItem)}</View>
        </GlassView>
      </View>
    );
  }

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        paddingBottom: insets.bottom,
        backgroundColor: isDark ? 'rgba(23, 21, 18, 0.96)' : 'rgba(255, 255, 255, 0.96)',
        borderTopWidth: StyleSheet.hairlineWidth * 2,
        borderTopColor: theme.borderStrong,
      }}
    >
      {items.map(renderItem)}
    </View>
  );
}
